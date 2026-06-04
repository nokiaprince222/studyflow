import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

interface ApiErrorOptions {
  statusCode: number;
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: unknown;

  constructor(options: ApiErrorOptions) {
    super(options.message);
    this.name = 'ApiError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
  }
}

export function notFound(message = 'Ресурс не найден') {
  return new ApiError({
    statusCode: 404,
    code: 'NOT_FOUND',
    message
  });
}

export function validationFailed(details: unknown) {
  return new ApiError({
    statusCode: 400,
    code: 'VALIDATION_FAILED',
    message: 'Некорректные данные запроса',
    details
  });
}

export function errorHandler(error: FastifyError | ApiError, request: FastifyRequest, reply: FastifyReply) {
  const isApiError = error instanceof ApiError;
  const statusCode = isApiError ? error.statusCode : error.statusCode ?? 500;
  const code = isApiError ? error.code : statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
  const message = isApiError ? error.message : statusCode >= 500 ? 'Внутренняя ошибка сервера' : error.message;
  const details = isApiError ? error.details : undefined;

  request.log.error(
    {
      err: error,
      code,
      statusCode,
      operation: 'request.error'
    },
    'request failed'
  );

  reply.status(statusCode).send({
    error: {
      code,
      message,
      requestId: request.id,
      details
    }
  });
}

