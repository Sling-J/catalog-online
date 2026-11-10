// `pnpm --filter @catalog/api db:seed` — демо-магазины в базу из DATABASE_URL (корневой .env) и их фото в публичное
// хранилище. До этого — `db:migrate` и `storage:setup`.
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { loadConfig } from '../../config/index.js';
import { S3Storage } from '../../storage/index.js';
import * as schema from '../schema/index.js';
import { DEV_STAFF, seedDemo } from './seed.js';

/** Фото демо-магазина — те же, что у моков: design-assets/storefront в корне репозитория. */
const DEMO_PHOTOS_DIR = resolve(import.meta.dirname, '../../../../../../design-assets/storefront');

const config = loadConfig();
const sql = postgres(config.databaseUrl, { max: 1, onnotice: () => {} });
try {
  const keys = await seedDemo(drizzle({ client: sql, schema, casing: 'snake_case' }));
  console.log('Демо-магазины записаны: aigerim-kids (aigerim.kids@example.com / demo-password), skrytyj-magazin.');
  console.log(`Сотрудник суперадминки: ${DEV_STAFF.email} / ${DEV_STAFF.password}.`);

  const storage = new S3Storage(config.s3);
  for (const key of keys) {
    await storage.put('public', key, await readFile(resolve(DEMO_PHOTOS_DIR, basename(key))), 'image/jpeg');
  }
  console.log(`Фото демо-магазина в хранилище ${config.s3.publicBucket}: ${keys.length}.`);
} finally {
  await sql.end();
}
