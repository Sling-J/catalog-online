import { lt } from 'drizzle-orm';

import type { DbOrTx } from '../db/index.js';
import { authTokens, sessions, staffSessions } from '../db/schema/index.js';

/**
 * Уборка просроченного (T-610, scaling.md SC14): сессии магазинов и сотрудников, одноразовые токены писем и входа
 * «от имени». Просроченная запись и так не действует (`findActive`, `useToken` сравнивают срок) — уборка только
 * не даёт таблицам расти. Индексов по сроку нет: раз в сутки полный проход по небольшим таблицам дешевле, чем
 * индекс, который обновляется на каждом входе и продлении сессии.
 */
export const expiredRepository = {
  async deleteExpired(db: DbOrTx, now: Date): Promise<{ sessions: number; staffSessions: number; tokens: number }> {
    const [shop, staff, tokens] = await Promise.all([
      db.delete(sessions).where(lt(sessions.expiresAt, now)).returning({ id: sessions.id }),
      db.delete(staffSessions).where(lt(staffSessions.expiresAt, now)).returning({ id: staffSessions.id }),
      db.delete(authTokens).where(lt(authTokens.expiresAt, now)).returning({ id: authTokens.id }),
    ]);
    return { sessions: shop.length, staffSessions: staff.length, tokens: tokens.length };
  },
};
