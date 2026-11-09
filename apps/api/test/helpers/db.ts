import { randomUUID } from 'node:crypto';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { inject } from 'vitest';

import * as schema from '../../src/core/db/schema/index.js';
import type { Db } from '../../src/core/db/index.js';

const TEMPLATE_DB = 'catalog_template';

/** Своя база для файла тестов — копия шаблона с миграциями. Возвращает адрес подключения. */
export async function createTestDatabase(): Promise<string> {
  const adminUrl = inject('pgAdminUrl');
  const name = `test_${randomUUID().replaceAll('-', '')}`;
  const admin = postgres(adminUrl, { max: 1, onnotice: () => {} });
  try {
    await admin.unsafe(`create database "${name}" template "${TEMPLATE_DB}"`);
  } finally {
    await admin.end();
  }
  const url = new URL(adminUrl);
  url.pathname = `/${name}`;
  return url.toString();
}

/** Подключение Drizzle к базе теста — для проверок схемы и сида без приложения. */
export function connectTestDb(url: string): { db: Db; close: () => Promise<void> } {
  const sql = postgres(url, { max: 2, onnotice: () => {} });
  return { db: drizzle({ client: sql, schema, casing: 'snake_case' }), close: () => sql.end() };
}

/** Код ошибки PostgreSQL (`23505` — нарушена уникальность, `23503` — внешний ключ…) у упавшего запроса. */
export async function pgErrorCode(query: PromiseLike<unknown>): Promise<string | undefined> {
  try {
    await query;
  } catch (error) {
    const cause = (error as { cause?: { code?: string } }).cause;
    return cause?.code ?? (error as { code?: string }).code;
  }
  return undefined;
}
