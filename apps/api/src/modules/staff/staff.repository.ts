import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { accounts, auditLog, shops, staffUsers } from '../../core/db/schema/index.js';
import type { Cursor } from '../../core/pagination/index.js';

export type ShopStatus = 'draft' | 'published' | 'blocked';

export type StaffShopRow = {
  id: string;
  name: string | null;
  subdomain: string | null;
  email: string | null;
  status: ShopStatus;
  createdAt: Date;
  productCount: number;
  orderClicks30d: number;
  sortKey: string;
};

/** Действия сотрудников в журнале (FR-S3). */
export type AuditAction = 'block' | 'unblock' | 'impersonate';

const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

/** Магазин внешнего запроса — с именем таблицы явно (подзапросы, `pitfalls.md`). */
const SHOP_ID = sql.raw('"shops"."id"');

/**
 * Суперадминка (FR-S1–S3): сотрудники, все магазины, журнал. Исключение из правила «`shopId` первым аргументом»
 * (backend-structure.md, раздел 6): сотрудник видит все магазины.
 */
export const staffRepository = {
  async findStaffByEmail(db: DbOrTx, email: string): Promise<{ id: string; passwordHash: string } | null> {
    const [row] = await db
      .select({ id: staffUsers.id, passwordHash: staffUsers.passwordHash })
      .from(staffUsers)
      .where(eq(sql`lower(${staffUsers.email})`, email));
    return row ?? null;
  },

  /** Новый сотрудник или новый пароль существующего (`staff:create`). */
  async upsertStaff(db: DbOrTx, email: string, passwordHash: string): Promise<'created' | 'updated'> {
    const existing = await this.findStaffByEmail(db, email);
    if (existing) {
      await db.update(staffUsers).set({ passwordHash }).where(eq(staffUsers.id, existing.id));
      return 'updated';
    }
    await db.insert(staffUsers).values({ email, passwordHash });
    return 'created';
  },

  /** Магазины от новых к старым; поиск — по названию, адресу витрины и почте. На одну строку больше — есть ли дальше. */
  async listShops(db: DbOrTx, q: string | undefined, cursor: Cursor | null, limit: number): Promise<StaffShopRow[]> {
    const where: (SQL | undefined)[] = [];
    const term = q?.trim();
    if (term) {
      const pattern = likePattern(term);
      where.push(or(ilike(shops.name, pattern), ilike(shops.subdomain, pattern), ilike(accounts.email, pattern)));
    }
    if (cursor) {
      where.push(sql`(${shops.createdAt}, ${shops.id}) < (${String(cursor.key)}::timestamptz, ${cursor.id}::uuid)`);
    }
    const rows = await db
      .select({
        id: shops.id,
        name: shops.name,
        subdomain: shops.subdomain,
        email: accounts.email,
        status: shops.status,
        createdAt: shops.createdAt,
        productCount: sql<number>`(select count(*) from products sp where sp.shop_id = ${SHOP_ID})`.mapWith(Number),
        // 30 дней с сегодняшним — по часовому поясу магазина, как статистика
        orderClicks30d:
          sql<number>`(select coalesce(sum(sd.order_clicks), 0) from daily_stats sd where sd.shop_id = ${SHOP_ID} and sd.date > (now() at time zone "shops"."timezone")::date - 30)`.mapWith(
            Number,
          ),
        sortKey: sql<string>`"shops"."created_at"::text`,
      })
      .from(shops)
      .leftJoin(accounts, eq(accounts.shopId, shops.id))
      .where(and(...where))
      .orderBy(desc(shops.createdAt), desc(shops.id))
      .limit(limit + 1);
    return rows;
  },

  /** Магазин с аккаунта владельца, строка заблокирована до конца транзакции. */
  async findShopForUpdate(
    db: DbOrTx,
    shopId: string,
  ): Promise<{ id: string; status: ShopStatus; accountId: string | null } | null> {
    const [row] = await db
      .select({ id: shops.id, status: shops.status, accountId: accounts.id })
      .from(shops)
      .leftJoin(accounts, eq(accounts.shopId, shops.id))
      .where(eq(shops.id, shopId))
      .for('update', { of: shops });
    return row ?? null;
  },

  async setStatus(db: DbOrTx, shopId: string, status: ShopStatus): Promise<void> {
    await db.update(shops).set({ status }).where(eq(shops.id, shopId));
  },

  /** Статус до последней блокировки (из журнала) или `null`. */
  async statusBeforeBlock(db: DbOrTx, shopId: string): Promise<ShopStatus | null> {
    const [row] = await db
      .select({ payload: auditLog.payload })
      .from(auditLog)
      .where(and(eq(auditLog.shopId, shopId), eq(auditLog.action, 'block')))
      .orderBy(desc(auditLog.createdAt), desc(auditLog.id))
      .limit(1);
    const previous = row?.payload?.previousStatus;
    return previous === 'draft' || previous === 'published' ? previous : null;
  },

  async audit(
    db: DbOrTx,
    entry: { staffUserId: string; shopId: string; action: AuditAction; payload?: Record<string, unknown> },
  ): Promise<void> {
    await db.insert(auditLog).values({ ...entry, payload: entry.payload ?? null });
  },
};
