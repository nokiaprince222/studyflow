import type { FastifyBaseLogger } from 'fastify';
import { Redis } from 'ioredis';
import { config } from './config.js';

type CacheBackend = 'disabled' | 'redis' | 'unavailable';

interface CacheLookup<T> {
  backend: CacheBackend;
  hit: boolean;
  value: T | null;
}

let redis: Redis | null = null;
let connectPromise: Promise<Redis | null> | null = null;
let unavailableUntil = 0;

function redisUrl() {
  return config.cache.redisUrl.trim();
}

function markUnavailable() {
  unavailableUntil = Date.now() + 10_000;
}

async function getRedis(log?: FastifyBaseLogger) {
  const url = redisUrl();

  if (!url) {
    return null;
  }

  if (redis?.status === 'ready') {
    return redis;
  }

  if (Date.now() < unavailableUntil) {
    return null;
  }

  connectPromise ??= (async () => {
    const client = new Redis(url, {
      connectTimeout: 500,
      enableOfflineQueue: false,
      lazyConnect: true,
      maxRetriesPerRequest: 1
    });

    client.on('error', () => undefined);

    try {
      await client.connect();
      redis = client;
      log?.info({ operation: 'cache.redis.connected' }, 'redis cache connected');
      return client;
    } catch (error) {
      client.disconnect();
      markUnavailable();
      log?.warn({ err: error, operation: 'cache.redis.unavailable' }, 'redis cache unavailable');
      return null;
    } finally {
      connectPromise = null;
    }
  })();

  return connectPromise;
}

function fallbackBackend(): CacheBackend {
  return redisUrl() ? 'unavailable' : 'disabled';
}

export async function getJson<T>(key: string, log?: FastifyBaseLogger): Promise<CacheLookup<T>> {
  const client = await getRedis(log);

  if (!client) {
    return {
      backend: fallbackBackend(),
      hit: false,
      value: null
    };
  }

  try {
    const raw = await client.get(key);

    if (!raw) {
      return {
        backend: 'redis',
        hit: false,
        value: null
      };
    }

    return {
      backend: 'redis',
      hit: true,
      value: JSON.parse(raw) as T
    };
  } catch (error) {
    markUnavailable();
    log?.warn({ err: error, operation: 'cache.get.failed', cacheKey: key }, 'cache read failed');
    return {
      backend: 'unavailable',
      hit: false,
      value: null
    };
  }
}

export async function setJson(key: string, value: unknown, ttlSeconds: number, log?: FastifyBaseLogger) {
  const client = await getRedis(log);

  if (!client) {
    return;
  }

  try {
    await client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  } catch (error) {
    markUnavailable();
    log?.warn({ err: error, operation: 'cache.set.failed', cacheKey: key }, 'cache write failed');
  }
}

export async function deleteCacheKey(key: string, log?: FastifyBaseLogger) {
  const client = await getRedis(log);

  if (!client) {
    return;
  }

  try {
    await client.del(key);
  } catch (error) {
    markUnavailable();
    log?.warn({ err: error, operation: 'cache.delete.failed', cacheKey: key }, 'cache delete failed');
  }
}

export async function closeCache() {
  if (redis) {
    await redis.quit().catch(() => redis?.disconnect());
    redis = null;
  }
}
