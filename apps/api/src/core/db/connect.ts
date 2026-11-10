import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import * as schema from './schema/index.js';
import type { Db } from './types.js';

/** Подключение вне приложения Nest — для разовых команд (`staff:create`). Закрыть — `close()`. */
export function connectDb(databaseUrl: string): { db: Db; close: () => Promise<void> } {
  const sql = postgres(databaseUrl, { max: 1, onnotice: () => {} });
  return { db: drizzle({ client: sql, schema, casing: 'snake_case' }), close: () => sql.end() };
}
