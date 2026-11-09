// Статистика (data-model.md, «Статистика», DM4): счётчики по дням, без сырых событий.
import { date, integer, pgTable, unique, uuid } from 'drizzle-orm/pg-core';

import { products } from './catalog.js';
import { shops } from './shops.js';

/**
 * Просмотры и нажатия «Заказать через WhatsApp» по дням (дата — по часовому поясу магазина).
 * `productId = null` — витрина в целом. Первичного ключа нет: в нём не может быть NULL, поэтому уникальность —
 * `unique nulls not distinct` (PostgreSQL 15+), на неё опирается `insert … on conflict do update`.
 */
export const dailyStats = pgTable(
  'daily_stats',
  {
    shopId: uuid()
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    date: date({ mode: 'string' }).notNull(),
    productId: uuid().references(() => products.id, { onDelete: 'cascade' }),
    views: integer().notNull().default(0),
    orderClicks: integer().notNull().default(0),
  },
  (t) => [unique('daily_stats_day_unique').on(t.shopId, t.date, t.productId).nullsNotDistinct()],
);
