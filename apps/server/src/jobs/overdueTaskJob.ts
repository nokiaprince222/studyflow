import type { FastifyInstance } from 'fastify';
import { config } from '../config.js';
import { prisma } from '../prisma.js';

export function startOverdueTaskJob(app: FastifyInstance) {
  if (config.jobs.overdueScanMs === 0) {
    app.log.info({ operation: 'tasks.overdue_job.disabled' }, 'overdue task job disabled');
    return () => undefined;
  }

  async function run() {
    const now = new Date();
    const result = await prisma.task.updateMany({
      where: {
        dueDate: {
          lt: now
        },
        status: {
          not: 'done'
        },
        overdueNotifiedAt: null
      },
      data: {
        overdueNotifiedAt: now
      }
    });

    app.log.info(
      {
        operation: 'tasks.overdue_job.completed',
        updatedCount: result.count
      },
      'overdue tasks processed'
    );
  }

  const timer = setInterval(() => {
    run().catch((error) => {
      app.log.error({ err: error, operation: 'tasks.overdue_job.failed' }, 'overdue task job failed');
    });
  }, config.jobs.overdueScanMs);

  run().catch((error) => {
    app.log.error({ err: error, operation: 'tasks.overdue_job.failed' }, 'overdue task job failed');
  });

  return () => clearInterval(timer);
}

