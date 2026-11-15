import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { signUp } from '../../../test/helpers/session.js';
import type { Db } from '../db/index.js';
import { authTokens, sessions, staffSessions, staffUsers } from '../db/schema/index.js';
import { CLEANUP_EXPIRED } from './cleanup-expired.worker.js';

const HOUR_MS = 3_600_000;

describe('уборка просроченных сессий и токенов (T-610)', () => {
  let t: TestApp;
  let db: Db;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    t = await createTestApp();
    ({ db, close: closeDb } = connectTestDb(t.config.databaseUrl));
  });
  afterAll(async () => {
    await closeDb?.();
    await t?.close();
  });

  it('расписание раз в сутки', () => {
    expect(t.jobs.scheduled()).toContainEqual(['auth.cleanup', '0 21 * * *']);
  });

  it('удаляет только просроченное; действующая сессия продолжает работать', async () => {
    const { agent, me } = await signUp(t, 'cleanup@example.com');
    const past = new Date(Date.now() - HOUR_MS);
    const future = new Date(Date.now() + HOUR_MS);
    const [staff] = await db
      .insert(staffUsers)
      .values({ email: 'staff-cleanup@example.com', passwordHash: 'x' })
      .returning({ id: staffUsers.id });
    await db.insert(sessions).values({ id: 'expired-session', accountId: me.account.id, expiresAt: past });
    await db.insert(staffSessions).values([
      { id: 'expired-staff', staffUserId: staff!.id, expiresAt: past },
      { id: 'active-staff', staffUserId: staff!.id, expiresAt: future },
    ]);
    await db.insert(authTokens).values([
      { accountId: me.account.id, purpose: 'verify_email', tokenHash: 'expired-token', expiresAt: past },
      { accountId: me.account.id, purpose: 'reset_password', tokenHash: 'active-token', expiresAt: future },
    ]);

    await t.jobs.run(CLEANUP_EXPIRED, {});

    const sessionIds = (await db.select({ id: sessions.id }).from(sessions)).map((row) => row.id);
    expect(sessionIds).not.toContain('expired-session');
    expect(sessionIds).toHaveLength(1);
    expect((await db.select({ id: staffSessions.id }).from(staffSessions)).map((row) => row.id)).toEqual([
      'active-staff',
    ]);
    expect((await db.select({ hash: authTokens.tokenHash }).from(authTokens)).map((row) => row.hash)).toEqual([
      'active-token',
    ]);
    await agent.get('/v1/auth/me').expect(200);
  });
});
