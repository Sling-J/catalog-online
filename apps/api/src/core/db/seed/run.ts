// `pnpm --filter @catalog/api db:seed` — демо-магазины в базу из DATABASE_URL (корневой .env). Миграции — до этого,
// `db:migrate`. Файлы фото в хранилище сид не кладёт (T-405).
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { loadConfig } from '../../config/index.js';
import * as schema from '../schema/index.js';
import { seedDemo } from './seed.js';

const sql = postgres(loadConfig().databaseUrl, { max: 1, onnotice: () => {} });
try {
  await seedDemo(drizzle({ client: sql, schema, casing: 'snake_case' }));
  console.log('Демо-магазины записаны: aigerim-kids (aigerim.kids@example.com / demo-password), skrytyj-magazin.');
} finally {
  await sql.end();
}
