import amqp, { type Channel, type ChannelModel, type ConsumeMessage } from 'amqplib';
import type { FastifyBaseLogger } from 'fastify';
import { Prisma } from '@prisma/client';
import { config } from './config.js';
import { prisma } from './prisma.js';

export type TaskEventType = 'task.created' | 'task.updated' | 'task.deleted';
export type TaskEventPayload = Prisma.InputJsonObject;

export interface TaskEventMessage {
  type: TaskEventType;
  taskId: string;
  payload: TaskEventPayload;
  occurredAt: string;
}

let connection: ChannelModel | null = null;
let publishChannel: Channel | null = null;
let consumeChannel: Channel | null = null;
let connectionPromise: Promise<ChannelModel | null> | null = null;
let unavailableUntil = 0;

function rabbitmqUrl() {
  return config.queue.rabbitmqUrl.trim();
}

function markUnavailable() {
  unavailableUntil = Date.now() + 10_000;
}

function queueName() {
  return config.queue.taskEventsQueue;
}

export function createTaskEvent(
  type: TaskEventType,
  taskId: string,
  payload: TaskEventPayload = {},
  occurredAt = new Date()
): TaskEventMessage {
  return {
    type,
    taskId,
    payload,
    occurredAt: occurredAt.toISOString()
  };
}

async function getConnection(log?: FastifyBaseLogger) {
  const url = rabbitmqUrl();

  if (!url) {
    return null;
  }

  if (connection) {
    return connection;
  }

  if (Date.now() < unavailableUntil) {
    return null;
  }

  connectionPromise ??= (async () => {
    try {
      const nextConnection = await amqp.connect(url);

      nextConnection.on('error', () => undefined);
      nextConnection.on('close', () => {
        connection = null;
        publishChannel = null;
        consumeChannel = null;
      });

      connection = nextConnection;
      log?.info({ operation: 'queue.rabbitmq.connected' }, 'rabbitmq connected');
      return nextConnection;
    } catch (error) {
      markUnavailable();
      log?.warn({ err: error, operation: 'queue.rabbitmq.unavailable' }, 'rabbitmq unavailable');
      return null;
    } finally {
      connectionPromise = null;
    }
  })();

  return connectionPromise;
}

async function getPublishChannel(log?: FastifyBaseLogger) {
  if (publishChannel) {
    return publishChannel;
  }

  const nextConnection = await getConnection(log);

  if (!nextConnection) {
    return null;
  }

  publishChannel = await nextConnection.createChannel();
  publishChannel.on('close', () => {
    publishChannel = null;
  });
  await publishChannel.assertQueue(queueName(), { durable: true });

  return publishChannel;
}

function parseMessage(message: ConsumeMessage) {
  return JSON.parse(message.content.toString('utf-8')) as TaskEventMessage;
}

async function saveTaskEvent(event: TaskEventMessage) {
  await prisma.taskEvent.create({
    data: {
      taskId: event.taskId,
      type: event.type,
      payload: event.payload,
      occurredAt: new Date(event.occurredAt)
    }
  });
}

export async function publishTaskEvent(event: TaskEventMessage, log?: FastifyBaseLogger) {
  const channel = await getPublishChannel(log);

  if (!channel) {
    return false;
  }

  try {
    const sent = channel.sendToQueue(queueName(), Buffer.from(JSON.stringify(event)), {
      contentType: 'application/json',
      persistent: true
    });

    log?.info(
      {
        operation: 'queue.task_event.published',
        eventType: event.type,
        taskId: event.taskId,
        queue: queueName()
      },
      'task event published'
    );

    return sent;
  } catch (error) {
    markUnavailable();
    log?.warn({ err: error, operation: 'queue.task_event.publish_failed', taskId: event.taskId }, 'task event publish failed');
    return false;
  }
}

export async function startTaskEventConsumer(log: FastifyBaseLogger) {
  const nextConnection = await getConnection(log);

  if (!nextConnection) {
    log.info({ operation: 'queue.task_event.consumer.disabled' }, 'task event consumer disabled');
    return async () => undefined;
  }

  consumeChannel = await nextConnection.createChannel();
  consumeChannel.on('close', () => {
    consumeChannel = null;
  });
  await consumeChannel.assertQueue(queueName(), { durable: true });
  await consumeChannel.prefetch(5);

  const consumer = await consumeChannel.consume(queueName(), async (message) => {
    if (!message || !consumeChannel) {
      return;
    }

    try {
      const event = parseMessage(message);
      await saveTaskEvent(event);
      consumeChannel.ack(message);
      log.info(
        {
          operation: 'queue.task_event.processed',
          eventType: event.type,
          taskId: event.taskId
        },
        'task event processed'
      );
    } catch (error) {
      consumeChannel.nack(message, false, false);
      log.error({ err: error, operation: 'queue.task_event.failed' }, 'task event processing failed');
    }
  });

  log.info({ operation: 'queue.task_event.consumer.started', queue: queueName() }, 'task event consumer started');

  return async () => {
    await consumeChannel?.cancel(consumer.consumerTag).catch(() => undefined);
    await consumeChannel?.close().catch(() => undefined);
    consumeChannel = null;
  };
}

export async function closeQueue() {
  await consumeChannel?.close().catch(() => undefined);
  await publishChannel?.close().catch(() => undefined);
  await connection?.close().catch(() => undefined);
  consumeChannel = null;
  publishChannel = null;
  connection = null;
}
