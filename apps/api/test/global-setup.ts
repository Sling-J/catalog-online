import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import type { TestProject } from 'vitest/node';

import { contractCoverageError } from './contract-coverage.js';

// То же имя — в helpers/db.ts
const TEMPLATE_DB = 'catalog_template';
const MIGRATIONS = resolve(import.meta.dirname, '../drizzle');

/**
 * Глобальная подготовка e2e: PostgreSQL в контейнере (Testcontainers, решение 5 в backend-structure.md),
 * миграции один раз в базу-шаблон. Каждый файл тестов создаёт свою базу из шаблона (`helpers/db.ts`).
 * Нужен запущенный Docker.
 */
export default async function setup(project: TestProject) {
  // Та же версия, что в docker-compose.yml
  const container = await new PostgreSqlContainer('postgres:18-alpine').withDatabase(TEMPLATE_DB).start();

  const sql = postgres(container.getConnectionUri(), { max: 1, onnotice: () => {} });
  // Миграций нет до T-402 — тогда шаблон пустой
  if (existsSync(resolve(MIGRATIONS, 'meta/_journal.json'))) {
    await migrate(drizzle({ client: sql }), { migrationsFolder: MIGRATIONS });
  }
  await sql.end();

  // Подключение к служебной базе `postgres`: из неё создаются базы файлов тестов
  const admin = new URL(container.getConnectionUri());
  admin.pathname = '/postgres';
  project.provide('pgAdminUrl', admin.toString());

  // T-413: сюда тестовые приложения пишут пары «операция — код»; после прогона — сводка покрытия контракта
  const coverageDir = mkdtempSync(resolve(tmpdir(), 'contract-coverage-'));
  project.provide('contractCoverageDir', coverageDir);

  return async () => {
    await container.stop();
    const error = contractCoverageError(coverageDir);
    rmSync(coverageDir, { recursive: true, force: true });
    if (error) throw new Error(error);
  };
}

declare module 'vitest' {
  export interface ProvidedContext {
    pgAdminUrl: string;
    contractCoverageDir: string;
  }
}
