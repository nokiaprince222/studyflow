import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const migrationsDir = path.join(rootDir, 'prisma', 'migrations');
const prisma = new PrismaClient();

function splitSql(sql) {
  return sql
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith('--'))
    .join('\n')
    .split(';')
    .map((statement) => statement.trim())
    .filter(Boolean);
}

function isAlreadyAppliedError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return /already exists|duplicate column name|duplicate/i.test(message);
}

async function ensureMigrationTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "checksum" TEXT NOT NULL,
      "finished_at" DATETIME,
      "migration_name" TEXT NOT NULL,
      "logs" TEXT,
      "rolled_back_at" DATETIME,
      "started_at" DATETIME NOT NULL DEFAULT current_timestamp,
      "applied_steps_count" INTEGER NOT NULL DEFAULT 0
    )
  `);
}

async function getAppliedMigrations() {
  const rows = await prisma.$queryRawUnsafe(
    'SELECT "migration_name" FROM "_prisma_migrations" WHERE "rolled_back_at" IS NULL'
  );

  return new Set(rows.map((row) => row.migration_name));
}

async function recordMigration(name, sql, stepCount) {
  const checksum = createHash('sha256').update(sql).digest('hex');

  await prisma.$executeRawUnsafe(
    `INSERT INTO "_prisma_migrations"
      ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
      VALUES (?, ?, CURRENT_TIMESTAMP, ?, NULL, NULL, CURRENT_TIMESTAMP, ?)`,
    randomUUID(),
    checksum,
    name,
    stepCount
  );
}

async function applyMigration(name) {
  const migrationFile = path.join(migrationsDir, name, 'migration.sql');

  if (!existsSync(migrationFile)) {
    throw new Error(`Migration file not found: ${migrationFile}`);
  }

  const sql = readFileSync(migrationFile, 'utf-8');
  const statements = splitSql(sql);

  for (const statement of statements) {
    try {
      await prisma.$executeRawUnsafe(statement);
    } catch (error) {
      if (!isAlreadyAppliedError(error)) {
        throw error;
      }

      console.warn(`Skipped already applied statement in ${name}`);
    }
  }

  await recordMigration(name, sql, statements.length);
  console.log(`Applied migration ${name}`);
}

async function main() {
  await ensureMigrationTable();
  const applied = await getAppliedMigrations();
  const migrations = readdirSync(migrationsDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  for (const migration of migrations) {
    if (applied.has(migration)) {
      console.log(`Migration ${migration} is already applied`);
      continue;
    }

    await applyMigration(migration);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

