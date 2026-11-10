import { and, eq, gt } from 'drizzle-orm';

import type { DbOrTx } from '../db/index.js';
import { staffSessions } from '../db/schema/index.js';

/** Сессии сотрудников суперадминки (cookie `staff_sid`). Магазина у них нет — правило `shopId` не применяется. */
export const staffSessionsRepository = {
  async create(
    db: DbOrTx,
    row: { id: string; staffUserId: string; expiresAt: Date; userAgent: string | null; ip: string | null },
  ): Promise<void> {
    await db.insert(staffSessions).values(row);
  },

  /** Сотрудник действующей сессии; просроченная — как нет. */
  async findActive(db: DbOrTx, id: string, now: Date): Promise<string | null> {
    const [row] = await db
      .select({ staffUserId: staffSessions.staffUserId })
      .from(staffSessions)
      .where(and(eq(staffSessions.id, id), gt(staffSessions.expiresAt, now)));
    return row?.staffUserId ?? null;
  },
};
