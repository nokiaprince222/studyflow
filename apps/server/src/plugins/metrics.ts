import fp from 'fastify-plugin';
import { collectDefaultMetrics, Counter, Registry } from 'prom-client';

export const metricsPlugin = fp(async (app) => {
  const registry = new Registry();

  collectDefaultMetrics({ register: registry });

  const successCounter = new Counter({
    name: 'http_requests_success_total',
    help: 'Total number of successful HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry]
  });

  const failureCounter = new Counter({
    name: 'http_requests_failure_total',
    help: 'Total number of failed HTTP requests',
    labelNames: ['method', 'route', 'status_code'],
    registers: [registry]
  });

  app.addHook('onResponse', (request, reply, done) => {
    const route = request.routeOptions.url ?? request.url;
    const labels = {
      method: request.method,
      route,
      status_code: String(reply.statusCode)
    };

    if (reply.statusCode >= 400) {
      failureCounter.inc(labels);
    } else {
      successCounter.inc(labels);
    }

    done();
  });

  app.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', registry.contentType);
    return registry.metrics();
  });
});

