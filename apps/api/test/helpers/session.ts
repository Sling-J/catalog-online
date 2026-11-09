import request from 'supertest';

import { hashToken, newToken, SESSION_COOKIE, SESSION_TTL_MS } from '../../src/core/auth/index.js';
import { accounts, sessions, shops } from '../../src/core/db/schema/index.js';
import type { TestApp } from './app.js';
import { connectTestDb } from './db.js';

/** Заголовок, без которого API не принимает изменяющие запросы. */
export const XRW = { 'X-Requested-With': 'XMLHttpRequest' } as const;

export const TEST_PASSWORD = 'correct-horse-1';

/** «Браузер»: хранит cookie между запросами. */
export const browser = (t: TestApp) => request.agent(t.app.getHttpServer());
export type Browser = ReturnType<typeof browser>;

/**
 * Магазин-черновик с владельцем и открытой сессией — прямо в базе, без `POST /register`: так тесты модулей не
 * упираются в ограничение частоты регистрации и не ждут argon2. Сам вход проверяет `auth.e2e.test.ts`.
 */
export async function signUp(t: TestApp, email: string) {
  const { db, close } = connectTestDb(t.config.databaseUrl);
  try {
    const [shop] = await db.insert(shops).values({}).returning({ id: shops.id });
    const [account] = await db
      .insert(accounts)
      .values({ shopId: shop!.id, email, passwordHash: 'not-a-real-hash' })
      .returning({ id: accounts.id });
    const token = newToken();
    await db
      .insert(sessions)
      .values({ id: hashToken(token), accountId: account!.id, expiresAt: new Date(Date.now() + SESSION_TTL_MS) });
    const agent = browser(t);
    agent.set('Cookie', `${SESSION_COOKIE}=${token}`);
    return { agent, me: { account: { id: account!.id }, shop: { id: shop!.id } } };
  } finally {
    await close();
  }
}
