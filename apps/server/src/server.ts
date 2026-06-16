import cors from '@fastify/cors';
import Fastify from 'fastify';
import { closeCache } from './cache.js';
import { config } from './config.js';
import { errorHandler } from './errors.js';
import { metricsPlugin } from './plugins/metrics.js';
import { closeQueue } from './queue.js';
import { taskRoutes } from './routes/tasks.js';

export async function buildServer() {
  const app = Fastify({
    logger: {
      level: config.logLevel
    },
    genReqId: (request) => request.headers['x-request-id']?.toString() ?? crypto.randomUUID()
  });

  app.setErrorHandler(errorHandler);
  app.addHook('onClose', async () => {
    await closeCache();
    await closeQueue();
  });

  await app.register(cors, {
    origin: config.corsOrigin === '*' ? true : config.corsOrigin
  });

  await app.register(metricsPlugin);

  app.get('/health', async () => ({
    ok: true,
    service: 'studyflow-server'
  }));

  await app.register(taskRoutes, {
    prefix: '/api/tasks'
  });

  return app;
}
