// Суперадминка (data-model.md, «Суперадминка»): наши сотрудники отдельно от магазинов.
import { sql } from 'drizzle-orm';
import { index, jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

import { at, createdAt, id } from './columns.js';

export const staffUsers = pgTable(
  'staff_users',
  {
    id: id(),
    email: text().notNull(),
    passwordHash: text().notNull(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('staff_users_email_unique').on(sql`lower(${t.email})`)],
);

/** Сессии сотрудников (cookie `staff_sid`), устроены как `sessions` магазина. */
export const staffSessions = pgTable(
  'staff_sessions',
  {
    id: text().primaryKey(),
    staffUserId: uuid()
      .notNull()
      .references(() => staffUsers.id, { onDelete: 'cascade' }),
    expiresAt: at().notNull(),
    userAgent: text(),
    ip: text(),
    createdAt: createdAt(),
  },
  (t) => [index('staff_sessions_user_idx').on(t.staffUserId)],
);

/**
 * Журнал действий сотрудников (FR-S3): `block`, `unblock`, `impersonate`… Магазин без внешнего ключа —
 * запись остаётся, даже если магазин удалят.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: id(),
    staffUserId: uuid()
      .notNull()
      .references(() => staffUsers.id),
    shopId: uuid(),
    action: text().notNull(),
    payload: jsonb().$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index('audit_log_shop_idx').on(t.shopId, t.createdAt)],
);
