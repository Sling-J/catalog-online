import { and, eq, ne } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { accounts, shops, type ShopLogo } from '../../core/db/schema/index.js';
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

  /** Строка магазина, заблокированная до конца транзакции (замена логотипа: прежний удаляем после). */
  async findByIdForUpdate(db: DbOrTx, shopId: string): Promise<ShopRow | null> {
    const [row] = await db.select().from(shops).where(eq(shops.id, shopId)).for('update');
    return row ?? null;
  },

  async setLogo(db: DbOrTx, shopId: string, logo: ShopLogo | null): Promise<ShopRow | null> {
    const [row] = await db.update(shops).set({ logo }).where(eq(shops.id, shopId)).returning();
    return row ?? null;
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

  /** Подтверждена ли почта владельца — публикация до подтверждения закрыта (A9). Только чтение таблицы входа. */
  async isEmailVerified(db: DbOrTx, shopId: string): Promise<boolean> {
    const [row] = await db
      .select({ verifiedAt: accounts.emailVerifiedAt })
      .from(accounts)
      .where(eq(accounts.shopId, shopId));
    return Boolean(row?.verifiedAt);
  },
};
