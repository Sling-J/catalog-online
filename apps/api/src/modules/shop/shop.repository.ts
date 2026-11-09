import { and, count, eq, ne, notExists, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { accounts, productPhotos, products, shops } from '../../core/db/schema/index.js';
import type { ProductCounts } from './lib/readiness.js';
import type { ShopPatch } from './lib/shop-update.js';

export type ShopRow = InferSelectModel<typeof shops>;

/** Магазин текущей сессии. Все функции — по `shopId` (backend-structure.md, раздел 6). */
export const shopRepository = {
  async findById(db: DbOrTx, shopId: string): Promise<ShopRow | null> {
    const [row] = await db.select().from(shops).where(eq(shops.id, shopId));
    return row ?? null;
  },

  async update(db: DbOrTx, shopId: string, patch: ShopPatch): Promise<ShopRow | null> {
    if (Object.keys(patch).length === 0) return this.findById(db, shopId);
    const [row] = await db.update(shops).set(patch).where(eq(shops.id, shopId)).returning();
    return row ?? null;
  },

  async setStatus(
    db: DbOrTx,
    shopId: string,
    status: 'draft' | 'published',
    publishedAt?: Date,
  ): Promise<ShopRow | null> {
    const [row] = await db
      .update(shops)
      .set({ status, ...(publishedAt ? { publishedAt } : {}) })
      .where(eq(shops.id, shopId))
      .returning();
    return row ?? null;
  },

  async clearLogo(db: DbOrTx, shopId: string): Promise<void> {
    await db.update(shops).set({ logoKey: null }).where(eq(shops.id, shopId));
  },

  /** Занят ли адрес другим магазином. */
  async isSubdomainTaken(db: DbOrTx, shopId: string, subdomain: string): Promise<boolean> {
    const [row] = await db
      .select({ id: shops.id })
      .from(shops)
      .where(and(eq(shops.subdomain, subdomain), ne(shops.id, shopId)))
      .limit(1);
    return row !== undefined;
  },

  /**
   * Числа товаров для чек-листа. Только чтение чужих таблиц (каталог — область модуля товаров, T-407): когда он
   * появится, подсчёт переедет в его сервис.
   */
  async productCounts(db: DbOrTx, shopId: string): Promise<ProductCounts> {
    const [row] = await db
      .select({
        total: count(),
        visible: sql<number>`count(*) filter (where ${products.isVisible})`.mapWith(Number),
        withoutPhoto: sql<number>`count(*) filter (where ${notExists(
          db
            .select({ one: sql`1` })
            .from(productPhotos)
            .where(eq(productPhotos.productId, products.id)),
        )})`.mapWith(Number),
      })
      .from(products)
      .where(eq(products.shopId, shopId));
    return { total: row?.total ?? 0, visible: row?.visible ?? 0, withoutPhoto: row?.withoutPhoto ?? 0 };
  },

  /** Подтверждена ли почта владельца — публикация до подтверждения закрыта (A9). Только чтение таблицы входа. */
  async isEmailVerified(db: DbOrTx, shopId: string): Promise<boolean> {
    const [row] = await db
      .select({ verifiedAt: accounts.emailVerifiedAt })
      .from(accounts)
      .where(eq(accounts.shopId, shopId));
    return Boolean(row?.verifiedAt);
  },
};
