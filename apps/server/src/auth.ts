import type { FastifyReply, FastifyRequest } from 'fastify';
import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import { config } from './config.js';
import { unauthorized } from './errors.js';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

export function isAuthEnabled() {
  return config.auth.oidcIssuer.trim().length > 0;
}

function jwksUrl() {
  if (config.auth.oidcJwksUri.trim()) {
    return config.auth.oidcJwksUri.trim();
  }

  return `${config.auth.oidcIssuer.replace(/\/$/, '')}/protocol/openid-connect/certs`;
}

function getJwks() {
  jwks ??= createRemoteJWKSet(new URL(jwksUrl()));
  return jwks;
}

function valueIncludes(value: unknown, expected: string) {
  if (typeof value === 'string') {
    return value === expected;
  }

  if (Array.isArray(value)) {
    return value.includes(expected);
  }

  return false;
}

export function tokenMatchesClient(payload: JWTPayload, clientId: string) {
  if (!clientId) {
    return true;
  }

  return valueIncludes(payload.aud, clientId) || payload.azp === clientId || payload.client_id === clientId;
}

function extractBearerToken(request: FastifyRequest) {
  const header = request.headers.authorization;

  if (!header) {
    throw unauthorized();
  }

  const [scheme, token] = header.split(' ');

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw unauthorized('Некорректный Authorization header');
  }

  return token;
}

export async function requireAuth(request: FastifyRequest, _reply: FastifyReply) {
  if (!isAuthEnabled()) {
    return;
  }

  const token = extractBearerToken(request);

  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      issuer: config.auth.oidcIssuer
    });

    if (!tokenMatchesClient(payload, config.auth.oidcAudience)) {
      throw unauthorized('Токен выпущен не для этого клиента');
    }

    request.log.info(
      {
        operation: 'auth.token.valid',
        subject: payload.sub,
        clientId: payload.azp ?? payload.client_id
      },
      'request authorized'
    );
  } catch (error) {
    if (error instanceof Error && error.name === 'ApiError') {
      throw error;
    }

    request.log.warn({ err: error, operation: 'auth.token.invalid' }, 'request authorization failed');
    throw unauthorized('Недействительный токен доступа');
  }
}

