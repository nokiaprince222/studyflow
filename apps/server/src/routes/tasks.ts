import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { deleteCacheKey, getJson, setJson } from '../cache.js';
import { config } from '../config.js';
import { notFound, validationFailed } from '../errors.js';
import { prisma } from '../prisma.js';
import {
  createTaskSchema,
  listTaskQuerySchema,
  taskParamsSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type UpdateTaskInput
} from '../schemas/task.js';
import { getTaskStats, type TaskStats } from '../services/taskStats.js';

const TASK_STATS_CACHE_KEY = 'tasks:stats:v1';

function parseOrThrow<TSchema extends z.ZodTypeAny>(schema: TSchema, value: unknown): z.infer<TSchema> {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw validationFailed(result.error.flatten());
  }

  return result.data;
}

function toCreateData(input: CreateTaskInput) {
  return {
    title: input.title,
    description: input.description,
    status: input.status,
    priority: input.priority,
    dueDate: input.dueDate ? new Date(input.dueDate) : null
  };
}

function toUpdateData(input: UpdateTaskInput, previousStatus: string) {
  const nextStatus = input.status;
  const completedAt = nextStatus === 'done' && previousStatus !== 'done' ? new Date() : nextStatus && nextStatus !== 'done' ? null : undefined;

  return {
    ...input,
    dueDate: input.dueDate === undefined ? undefined : input.dueDate ? new Date(input.dueDate) : null,
    completedAt
  };
}

async function readStats(log: FastifyInstance['log']) {
  const cached = await getJson<TaskStats>(TASK_STATS_CACHE_KEY, log);

  if (cached.hit && cached.value) {
    return {
      ...cached.value,
      cache: {
        backend: cached.backend,
        hit: true,
        ttlSeconds: config.cache.statsTtlSeconds
      }
    };
  }

  const stats = await getTaskStats();
  await setJson(TASK_STATS_CACHE_KEY, stats, config.cache.statsTtlSeconds, log);

  return {
    ...stats,
    cache: {
      backend: cached.backend,
      hit: false,
      ttlSeconds: config.cache.statsTtlSeconds
    }
  };
}

async function invalidateStats(log: FastifyInstance['log']) {
  await deleteCacheKey(TASK_STATS_CACHE_KEY, log);
}

export async function taskRoutes(app: FastifyInstance) {
  app.get('/', async (request) => {
    const query = parseOrThrow(listTaskQuerySchema, request.query);

    request.log.info({ operation: 'tasks.list', query }, 'listing tasks');

    return prisma.task.findMany({
      where: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.q
          ? {
              OR: [
                {
                  title: {
                    contains: query.q
                  }
                },
                {
                  description: {
                    contains: query.q
                  }
                }
              ]
            }
          : {})
      },
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }]
    });
  });

  app.get('/stats', async (request) => {
    const stats = await readStats(request.log);

    request.log.info(
      {
        operation: 'tasks.stats',
        cache: stats.cache
      },
      'task stats loaded'
    );

    return stats;
  });

  app.get('/:id', async (request) => {
    const params = parseOrThrow(taskParamsSchema, request.params);
    const task = await prisma.task.findUnique({
      where: {
        id: params.id
      }
    });

    if (!task) {
      throw notFound('Задача не найдена');
    }

    request.log.info({ operation: 'tasks.get', taskId: params.id }, 'task loaded');
    return task;
  });

  app.post('/', async (request, reply) => {
    const body = parseOrThrow(createTaskSchema, request.body);
    const task = await prisma.task.create({
      data: toCreateData(body)
    });

    request.log.info({ operation: 'tasks.create', taskId: task.id }, 'task created');
    await invalidateStats(request.log);

    reply.code(201);
    return task;
  });

  app.patch('/:id', async (request) => {
    const params = parseOrThrow(taskParamsSchema, request.params);
    const body = parseOrThrow(updateTaskSchema, request.body);
    const existing = await prisma.task.findUnique({
      where: {
        id: params.id
      }
    });

    if (!existing) {
      throw notFound('Задача не найдена');
    }

    const task = await prisma.task.update({
      where: {
        id: params.id
      },
      data: toUpdateData(body, existing.status)
    });

    request.log.info({ operation: 'tasks.update', taskId: task.id }, 'task updated');
    await invalidateStats(request.log);
    return task;
  });

  app.delete('/:id', async (request) => {
    const params = parseOrThrow(taskParamsSchema, request.params);
    const existing = await prisma.task.findUnique({
      where: {
        id: params.id
      }
    });

    if (!existing) {
      throw notFound('Задача не найдена');
    }

    await prisma.task.delete({
      where: {
        id: params.id
      }
    });

    request.log.info({ operation: 'tasks.delete', taskId: params.id }, 'task deleted');
    await invalidateStats(request.log);

    return { ok: true };
  });
}
