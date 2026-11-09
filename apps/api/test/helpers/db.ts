import { randomUUID } from 'node:crypto';

import postgres from 'postgres';
import { inject } from 'vitest';

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
