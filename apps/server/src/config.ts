import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';

const dirname = path.dirname(fileURLToPath(import.meta.url));

const configSchema = z.object({
  host: z.string().min(1),
  port: z.number().int().positive(),
  databaseUrl: z.string().min(1),
  corsOrigin: z.string().min(1),
  logLevel: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
  jobs: z.object({
    overdueScanMs: z.number().int().nonnegative()
  })
});

type RawConfig = z.infer<typeof configSchema>;

function readConfigFile(): RawConfig {
  const configPath =
    process.env.APP_CONFIG ??
    [path.resolve(process.cwd(), 'config/default.json'), path.resolve(dirname, '../config/default.json')]
      .find((candidate) => fs.existsSync(candidate)) ??
    path.resolve(dirname, '../../config/default.json');
  const content = fs.readFileSync(configPath, 'utf-8');
  return configSchema.parse(JSON.parse(content));
}

function numberFromEnv(value: string | undefined, fallback: number) {
  return value ? Number(value) : fallback;
}

const fileConfig = readConfigFile();

export const config = configSchema.parse({
  host: process.env.HOST ?? fileConfig.host,
  port: numberFromEnv(process.env.PORT, fileConfig.port),
  databaseUrl: process.env.DATABASE_URL ?? fileConfig.databaseUrl,
  corsOrigin: process.env.CORS_ORIGIN ?? fileConfig.corsOrigin,
  logLevel: process.env.LOG_LEVEL ?? fileConfig.logLevel,
  jobs: {
    overdueScanMs: numberFromEnv(process.env.OVERDUE_SCAN_MS, fileConfig.jobs.overdueScanMs)
  }
});
