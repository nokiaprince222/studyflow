import type { FastifyInstance } from 'fastify';
import { z } from 'zod';
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

    return { ok: true };
  });
}
