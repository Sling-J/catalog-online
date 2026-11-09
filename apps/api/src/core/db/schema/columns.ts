import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

/** Первичный ключ: UUID v7 (DM1) — `uuidv7()` встроен в PostgreSQL 18. */
export const id = () =>
  uuid()
    .primaryKey()
    .default(sql`uuidv7()`);

/** Время в UTC (`timestamptz`); в коде — `Date`. */
export const at = () => timestamp({ withTimezone: true });

export const createdAt = () => at().notNull().defaultNow();

/** Обновляется Drizzle при каждом `update` через ORM. */
export const updatedAt = () =>
  at()
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date());
