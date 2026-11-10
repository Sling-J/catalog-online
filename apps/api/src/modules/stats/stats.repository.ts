import { and, asc, between, desc, eq, inArray, isNotNull, sql } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { dailyStats, productPhotos, products, shops } from '../../core/db/schema/index.js';
import type { StoredImage } from '../../core/images/index.js';

export type Counts = { views: number; orderClicks: number };
export type DayCounts = Counts & { date: string };
export type TopProductRow = { productId: string; name: string; views: number; cover: StoredImage | null };

const sumViews = sql<number>`coalesce(sum(${dailyStats.views}), 0)`.mapWith(Number);
const sumClicks = sql<number>`coalesce(sum(${dailyStats.orderClicks}), 0)`.mapWith(Number);

/**
 * Счётчики статистики по дням (DM4). Все функции — по `shopId`. Товары, фото и магазин только читаем (название,
 * обложка, часовой пояс).
 */
export const statsRepository = {
  /** +views / +orderClicks за день; строки дня нет — создаётся (`unique nulls not distinct`). */
  async increment(db: DbOrTx, shopId: string, date: string, productId: string | null, add: Counts): Promise<void> {
    await db
      .insert(dailyStats)
      .values({ shopId, date, productId, views: add.views, orderClicks: add.orderClicks })
      .onConflictDoUpdate({
        target: [dailyStats.shopId, dailyStats.date, dailyStats.productId],
        set: {
          views: sql`${dailyStats.views} + excluded.views`,
          orderClicks: sql`${dailyStats.orderClicks} + excluded.order_clicks`,
        },
      });
  },

  async shop(db: DbOrTx, shopId: string): Promise<{ timezone: string; createdAt: Date } | null> {
    const [row] = await db
      .select({ timezone: shops.timezone, createdAt: shops.createdAt })
      .from(shops)
      .where(eq(shops.id, shopId));
    return row ?? null;
  },

  /** Сумма за дни `from…to` — витрина и карточки вместе. */
  async totals(db: DbOrTx, shopId: string, from: string, to: string): Promise<Counts> {
    const [row] = await db
      .select({ views: sumViews, orderClicks: sumClicks })
      .from(dailyStats)
      .where(and(eq(dailyStats.shopId, shopId), between(dailyStats.date, from, to)));
    return row ?? { views: 0, orderClicks: 0 };
  },

  /** Дни, в которых что-то было (пустые дни дополняет сервис). */
  async byDay(db: DbOrTx, shopId: string, from: string, to: string): Promise<DayCounts[]> {
    return db
      .select({ date: dailyStats.date, views: sumViews, orderClicks: sumClicks })
      .from(dailyStats)
      .where(and(eq(dailyStats.shopId, shopId), between(dailyStats.date, from, to)))
      .groupBy(dailyStats.date);
  },

  /** «Чаще смотрят»: товары по просмотрам карточки за период, обложка — первое готовое фото. */
  async topProducts(db: DbOrTx, shopId: string, from: string, to: string, limit: number): Promise<TopProductRow[]> {
    const views = sql<number>`sum(${dailyStats.views})`.mapWith(Number);
    const rows = await db
      .select({ productId: products.id, name: products.name, views })
      .from(dailyStats)
      .innerJoin(products, eq(products.id, dailyStats.productId))
      .where(
        and(
          eq(dailyStats.shopId, shopId),
          eq(products.shopId, shopId),
          isNotNull(dailyStats.productId),
          between(dailyStats.date, from, to),
        ),
      )
      .groupBy(products.id, products.name)
      .having(sql`sum(${dailyStats.views}) > 0`)
      .orderBy(desc(views), asc(products.name), asc(products.id))
      .limit(limit);
    if (rows.length === 0) return [];
    const covers = await db
      .selectDistinctOn([productPhotos.productId], {
        productId: productPhotos.productId,
        sizes: productPhotos.sizes,
        width: productPhotos.width,
        height: productPhotos.height,
      })
      .from(productPhotos)
      .where(
        and(
          eq(productPhotos.shopId, shopId),
          eq(productPhotos.status, 'ready'),
          inArray(
            productPhotos.productId,
            rows.map((row) => row.productId),
          ),
        ),
      )
      .orderBy(productPhotos.productId, asc(productPhotos.position), asc(productPhotos.id));
    const coverOf = new Map(
      covers.map((c) => [c.productId, { sizes: c.sizes!, width: c.width!, height: c.height! } as StoredImage]),
    );
    return rows.map((row) => ({ ...row, cover: coverOf.get(row.productId) ?? null }));
  },
};
