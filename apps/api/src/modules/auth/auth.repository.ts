import { and, eq, gt, isNull, sql } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { accounts, authTokens, shops } from '../../core/db/schema/index.js';

export type TokenPurpose = 'verify_email' | 'reset_password';

export type AccountCredentials = { id: string; shopId: string; passwordHash: string };

export type MeRow = {
  accountId: string;
  email: string;
  emailVerifiedAt: Date | null;
  shopId: string;
  shopName: string | null;
  subdomain: string | null;
  status: 'draft' | 'published' | 'blocked';
  setupCompleted: boolean;
};

/**
 * Аккаунты, магазины при регистрации и одноразовые токены писем. Модуль `auth` — исключение из правила
 * «`shopId` первым аргументом» (backend-structure.md, раздел 6): вход ищет аккаунт по почте, магазина ещё нет.
 * Почта приходит уже в нижнем регистре (`normalizeEmail`).
 */
export const authRepository = {
  async findByEmail(db: DbOrTx, email: string): Promise<AccountCredentials | null> {
    const [row] = await db
      .select({ id: accounts.id, shopId: accounts.shopId, passwordHash: accounts.passwordHash })
      .from(accounts)
      .where(eq(sql`lower(${accounts.email})`, email));
    return row ?? null;
  },

  async findById(db: DbOrTx, accountId: string): Promise<(AccountCredentials & { email: string }) | null> {
    const [row] = await db
      .select({ id: accounts.id, shopId: accounts.shopId, passwordHash: accounts.passwordHash, email: accounts.email })
      .from(accounts)
      .where(eq(accounts.id, accountId));
    return row ?? null;
  },

  /** Магазин-черновик и его логин (FR-A1, D10). */
  async createShopWithAccount(
    tx: DbOrTx,
    input: { email: string; passwordHash: string },
  ): Promise<{ accountId: string; shopId: string }> {
    const [shop] = await tx.insert(shops).values({}).returning({ id: shops.id });
    const [account] = await tx
      .insert(accounts)
      .values({ shopId: shop!.id, email: input.email, passwordHash: input.passwordHash })
      .returning({ id: accounts.id });
    return { accountId: account!.id, shopId: shop!.id };
  },

  async findMe(db: DbOrTx, accountId: string): Promise<MeRow | null> {
    const [row] = await db
      .select({
        accountId: accounts.id,
        email: accounts.email,
        emailVerifiedAt: accounts.emailVerifiedAt,
        shopId: shops.id,
        shopName: shops.name,
        subdomain: shops.subdomain,
        status: shops.status,
        setupCompleted: shops.setupCompleted,
      })
      .from(accounts)
      .innerJoin(shops, eq(shops.id, accounts.shopId))
      .where(eq(accounts.id, accountId));
    return row ?? null;
  },

  async setPassword(db: DbOrTx, accountId: string, passwordHash: string): Promise<void> {
    await db.update(accounts).set({ passwordHash }).where(eq(accounts.id, accountId));
  },

  async markEmailVerified(db: DbOrTx, accountId: string, at: Date): Promise<void> {
    await db
      .update(accounts)
      .set({ emailVerifiedAt: at })
      .where(and(eq(accounts.id, accountId), isNull(accounts.emailVerifiedAt)));
  },

  async createToken(
    db: DbOrTx,
    row: { accountId: string; purpose: TokenPurpose; tokenHash: string; expiresAt: Date },
  ): Promise<void> {
    await db.insert(authTokens).values(row);
  },

  /**
   * Погасить токен одним запросом: только действующий и ещё не использованный. Две вкладки с одной ссылкой
   * не пройдут обе. Возвращает аккаунт или `null` (нет, просрочен, уже использован → 410).
   */
  async useToken(db: DbOrTx, purpose: TokenPurpose, tokenHash: string, now: Date): Promise<string | null> {
    const [row] = await db
      .update(authTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(authTokens.tokenHash, tokenHash),
          eq(authTokens.purpose, purpose),
          isNull(authTokens.usedAt),
          gt(authTokens.expiresAt, now),
        ),
      )
      .returning({ accountId: authTokens.accountId });
    return row?.accountId ?? null;
  },

  /** Погасить прежние ссылки того же назначения — действует только последнее письмо. */
  async revokeTokens(db: DbOrTx, accountId: string, purpose: TokenPurpose, now: Date): Promise<void> {
    await db
      .update(authTokens)
      .set({ usedAt: now })
      .where(and(eq(authTokens.accountId, accountId), eq(authTokens.purpose, purpose), isNull(authTokens.usedAt)));
  },
};
