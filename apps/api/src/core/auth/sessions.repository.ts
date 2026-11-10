import { and, eq, gt, ne } from 'drizzle-orm';

import type { DbOrTx } from '../db/index.js';
import { accounts, sessions } from '../db/schema/index.js';

export type SessionRow = {
  id: string;
  accountId: string;
  shopId: string;
  impersonatedBy: string | null;
  expiresAt: Date;
};

/**
 * Сессии магазинов. Исключение из правила «`shopId` первым аргументом» (backend-structure.md, раздел 6):
 * сессия ищется по хешу токена ещё до того, как известен магазин.
 */
export const sessionsRepository = {
  async create(
    db: DbOrTx,
    row: {
      id: string;
      accountId: string;
      expiresAt: Date;
      userAgent: string | null;
      ip: string | null;
      impersonatedBy?: string | null;
    },
  ): Promise<void> {
    await db.insert(sessions).values(row);
  },

  /** Действующая сессия с магазином аккаунта; просроченная — как нет. */
  async findActive(db: DbOrTx, id: string, now: Date): Promise<SessionRow | null> {
    const [row] = await db
      .select({
        id: sessions.id,
        accountId: sessions.accountId,
        shopId: accounts.shopId,
        impersonatedBy: sessions.impersonatedBy,
        expiresAt: sessions.expiresAt,
      })
      .from(sessions)
      .innerJoin(accounts, eq(accounts.id, sessions.accountId))
      .where(and(eq(sessions.id, id), gt(sessions.expiresAt, now)));
    return row ?? null;
  },

  async extend(db: DbOrTx, id: string, expiresAt: Date): Promise<void> {
    await db.update(sessions).set({ expiresAt }).where(eq(sessions.id, id));
  },

  async delete(db: DbOrTx, id: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.id, id));
  },

  /** Все сессии аккаунта, кроме `exceptId` (смена пароля оставляет текущую). */
  async deleteForAccount(db: DbOrTx, accountId: string, exceptId?: string): Promise<void> {
    await db
      .delete(sessions)
      .where(
        exceptId
          ? and(eq(sessions.accountId, accountId), ne(sessions.id, exceptId))
          : eq(sessions.accountId, accountId),
      );
  },
};
