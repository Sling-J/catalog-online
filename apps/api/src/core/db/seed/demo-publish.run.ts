// `pnpm --filter @catalog/api demo:publish` — демо-магазин для лендинга (`04-design/storefront.md`, S13) в базу из
// DATABASE_URL и его фото в публичное хранилище. Для продакшена: только `aigerim-kids`, войти в него нельзя (пароль
// владельца случайный и не печатается). Повторный запуск возвращает демо к исходному. До этого — `db:migrate` и
// хранилища. Фото берутся из design-assets/storefront в корне репозитория.
import { readFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { loadConfig } from '../../config/index.js';
import { S3Storage } from '../../storage/index.js';
import * as schema from '../schema/index.js';
import { DEMO_PHOTOS_DIR } from './photos.js';
import { publishDemo } from './seed.js';

const config = loadConfig();
const sql = postgres(config.databaseUrl, { max: 1, onnotice: () => {} });
try {
  const keys = await publishDemo(drizzle({ client: sql, schema, casing: 'snake_case' }));
  const storage = new S3Storage(config.s3);
  for (const key of keys) {
    await storage.put('public', key, await readFile(resolve(DEMO_PHOTOS_DIR, basename(key))), 'image/jpeg');
  }
  console.log(`Демо-магазин aigerim-kids опубликован, фото в хранилище ${config.s3.publicBucket}: ${keys.length}.`);
} finally {
  await sql.end();
}
