import { config } from './config.js';
import { startOverdueTaskJob } from './jobs/overdueTaskJob.js';
import { prisma } from './prisma.js';
import { buildServer } from './server.js';

async function main() {
  const app = await buildServer();
  const stopOverdueJob = startOverdueTaskJob(app);

  async function shutdown(signal: string) {
    app.log.info({ signal, operation: 'server.shutdown' }, 'server shutdown requested');
    stopOverdueJob();
    await app.close();
    await prisma.$disconnect();
  }

  process.on('SIGINT', () => {
    shutdown('SIGINT').finally(() => process.exit(0));
  });

  process.on('SIGTERM', () => {
    shutdown('SIGTERM').finally(() => process.exit(0));
  });

  await app.listen({
    host: config.host,
    port: config.port
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

