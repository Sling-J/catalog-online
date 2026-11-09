import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

import type * as schema from './schema/index.js';

/** Подключение к базе. */
export type Db = PostgresJsDatabase<typeof schema>;

/** Транзакция: `db.transaction(async (tx) => …)`. */
export type Tx = Parameters<Parameters<Db['transaction']>[0]>[0];

/** Первый аргумент функций репозитория: работают и в транзакции, и без неё (раздел 8). */
export type DbOrTx = Db | Tx;
