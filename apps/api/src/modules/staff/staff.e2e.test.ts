import { and, eq, isNotNull } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { browser, signUp, XRW, type Browser } from '../../../test/helpers/session.js';
import { hashPassword } from '../../core/auth/index.js';
import type { Db } from '../../core/db/index.js';
import { accounts, auditLog, dailyStats, sessions, shops, staffUsers } from '../../core/db/schema/index.js';

const STAFF_PASSWORD = 'staff-password-1';
const NO_SUCH = '0192d000-0000-7000-8000-00000000ffff';

/** Сегодня по Алматы и сдвиг в днях — `YYYY-MM-DD` (как в статистике). */
const almatyToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Almaty' }).format(new Date());
const addDays = (date: string, days: number) =>
  new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10);

describe('суперадминка', () => {
  let t: TestApp;
  let db: Db;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    t = await createTestApp();
    ({ db, close: closeDb } = connectTestDb(t.config.databaseUrl));
    await db
      .insert(staffUsers)
      .values({ email: 'support@example.com', passwordHash: await hashPassword(STAFF_PASSWORD) });
  });
  afterAll(async () => {
    await closeDb?.();
    await t?.close();
  });

  const login = (agent: Browser, email = 'support@example.com', password = STAFF_PASSWORD) =>
    agent.post('/v1/staff/login').set(XRW).send({ email, password });
  const staff = async (): Promise<Browser> => {
    const agent = browser(t);
    await login(agent).expect(204);
    return agent;
  };
  const shop = async (email: string, values: Partial<typeof shops.$inferInsert> = {}) => {
    const { agent, me } = await signUp(t, email);
    if (Object.keys(values).length) await db.update(shops).set(values).where(eq(shops.id, me.shop.id));
    return { agent, shopId: me.shop.id };
  };
  const audit = (shopId: string) =>
    db
      .select({ action: auditLog.action, payload: auditLog.payload })
      .from(auditLog)
      .where(eq(auditLog.shopId, shopId))
      .orderBy(auditLog.createdAt, auditLog.id);
  const status = async (shopId: string) =>
    (await db.select({ status: shops.status }).from(shops).where(eq(shops.id, shopId)))[0]!.status;

  it('вход: cookie staff_sid на 12 часов; неверный пароль и чужая почта — 401; почта без учёта регистра', async () => {
    const agent = browser(t);
    expect((await login(agent, 'support@example.com', 'wrong-password').expect(401)).body.code).toBe('unauthorized');
    await login(agent, 'nobody@example.com').expect(401);
    await agent.post('/v1/staff/login').set(XRW).send({ password: STAFF_PASSWORD }).expect(422);
    const { headers } = await login(agent, 'Support@Example.com').expect(204);
    const cookie = ([] as string[]).concat(headers['set-cookie'] ?? []).find((c) => c.startsWith('staff_sid='));
    expect(cookie).toMatch(/Max-Age=43200/);
    expect(cookie).toMatch(/HttpOnly/);
    await agent.get('/v1/staff/shops').expect(200);
  });

  it('без сессии сотрудника — 401, сессия магазина не подходит; не UUID и несуществующий магазин — 404', async () => {
    const owner = await shop('staff-401@example.com');
    const anon = request(t.app.getHttpServer());
    await anon.get('/v1/staff/shops').expect(401);
    await owner.agent.get('/v1/staff/shops').expect(401);
    await owner.agent.post(`/v1/staff/shops/${owner.shopId}/block`).set(XRW).send({}).expect(401);
    const agent = await staff();
    await agent.post(`/v1/staff/shops/${NO_SUCH}/block`).set(XRW).send({}).expect(404);
    await agent.post('/v1/staff/shops/not-a-uuid/unblock').set(XRW).expect(404);
    await agent.post(`/v1/staff/shops/${NO_SUCH}/impersonate`).set(XRW).expect(404);
  });

  it('список: новые сверху, число товаров и нажатий «Заказать» за 30 дней, поиск, курсор', async () => {
    const a = await shop('list-alpha@example.com', {
      name: 'Альфа 100%',
      subdomain: 'list-alpha',
      status: 'published',
    });
    const b = await shop('list-beta@example.com', { name: 'Бета', subdomain: 'list-beta' });
    await a.agent
      .post('/v1/admin/products')
      .set(XRW)
      .send({ name: 'Платье', variants: [{ price: 1, stock: 1, values: [] }] })
      .expect(201);
    const today = almatyToday();
    await db.insert(dailyStats).values([
      { shopId: a.shopId, date: today, productId: null, views: 5, orderClicks: 3 },
      { shopId: a.shopId, date: addDays(today, -29), productId: null, views: 0, orderClicks: 2 },
      { shopId: a.shopId, date: addDays(today, -30), productId: null, views: 0, orderClicks: 7 },
    ]);
    const agent = await staff();

    const { body } = await agent.get('/v1/staff/shops?q=list-').expect(200);
    expect(body.nextCursor).toBeNull();
    expect(body.items).toEqual([
      {
        id: b.shopId,
        name: 'Бета',
        subdomain: 'list-beta',
        email: 'list-beta@example.com',
        status: 'draft',
        createdAt: expect.any(String),
        productCount: 0,
        orderClicks30d: 0,
      },
      {
        id: a.shopId,
        name: 'Альфа 100%',
        subdomain: 'list-alpha',
        email: 'list-alpha@example.com',
        status: 'published',
        createdAt: expect.any(String),
        productCount: 1,
        orderClicks30d: 5,
      },
    ]);
    const ids = async (q: string) =>
      ((await agent.get(`/v1/staff/shops?q=${encodeURIComponent(q)}`).expect(200)).body.items as { id: string }[]).map(
        (item) => item.id,
      );
    expect(await ids('АЛЬФА')).toEqual([a.shopId]);
    expect(await ids('list-beta@')).toEqual([b.shopId]);
    expect(await ids('0%')).toEqual([a.shopId]);
    expect(await ids('1%')).toEqual([]);

    const first = (await agent.get('/v1/staff/shops?limit=1&q=list-').expect(200)).body;
    expect(first.items.map((i: { id: string }) => i.id)).toEqual([b.shopId]);
    const second = (await agent.get(`/v1/staff/shops?limit=1&q=list-&cursor=${first.nextCursor}`).expect(200)).body;
    expect(second).toMatchObject({ items: [{ id: a.shopId }], nextCursor: null });
    await agent.get('/v1/staff/shops?cursor=garbage').expect(422);
  });

  it('блокировка: витрина 410, владелец остаётся в админке и видит статус; разблокировка возвращает прежний; журнал', async () => {
    const owner = await shop('block@example.com', {
      name: 'Блок',
      subdomain: 'block-shop',
      whatsapp: '+77001234567',
      status: 'published',
      publishedAt: new Date(),
    });
    const agent = await staff();
    await agent.post(`/v1/staff/shops/${owner.shopId}/block`).set(XRW).send({ reason: '  Мошенничество ' }).expect(204);
    expect(await status(owner.shopId)).toBe('blocked');
    expect((await request(t.app.getHttpServer()).get('/v1/storefront/block-shop').expect(410)).body.code).toBe(
      'shop_blocked',
    );
    expect((await owner.agent.get('/v1/admin/shop').expect(200)).body.status).toBe('blocked');
    // повтор — без изменений и без новой записи
    await agent.post(`/v1/staff/shops/${owner.shopId}/block`).set(XRW).expect(204);

    await agent.post(`/v1/staff/shops/${owner.shopId}/unblock`).set(XRW).expect(204);
    expect(await status(owner.shopId)).toBe('published');
    await agent.post(`/v1/staff/shops/${owner.shopId}/unblock`).set(XRW).expect(204);
    expect(await audit(owner.shopId)).toEqual([
      { action: 'block', payload: { previousStatus: 'published', reason: 'Мошенничество' } },
      { action: 'unblock', payload: { status: 'published' } },
    ]);

    const draft = await shop('block-draft@example.com');
    await agent.post(`/v1/staff/shops/${draft.shopId}/block`).set(XRW).send({}).expect(204);
    expect((await audit(draft.shopId))[0]).toEqual({ action: 'block', payload: { previousStatus: 'draft' } });
    await agent.post(`/v1/staff/shops/${draft.shopId}/unblock`).set(XRW).expect(204);
    expect(await status(draft.shopId)).toBe('draft');
    await agent
      .post(`/v1/staff/shops/${draft.shopId}/block`)
      .set(XRW)
      .send({ reason: 'x'.repeat(501) })
      .expect(422);
  });

  it('вход «от имени»: sid на 2 часа без продления, плашка в getMe, смена пароля и письмо — 403; журнал; и у заблокированного', async () => {
    const owner = await shop('impersonate@example.com', { status: 'blocked' });
    const agent = await staff();
    const { headers } = await agent.post(`/v1/staff/shops/${owner.shopId}/impersonate`).set(XRW).expect(204);
    const cookie = ([] as string[]).concat(headers['set-cookie'] ?? []).find((c) => c.startsWith('sid='));
    expect(cookie).toMatch(/Max-Age=7200/);

    const me = (await agent.get('/v1/auth/me').expect(200)).body;
    expect(me).toMatchObject({
      account: { email: 'impersonate@example.com', impersonated: true },
      shop: { id: owner.shopId },
    });
    await agent.get('/v1/admin/products').expect(200);
    expect(
      (
        await agent
          .post('/v1/auth/password/change')
          .set(XRW)
          .send({ currentPassword: 'whatever', newPassword: 'new-password-1' })
          .expect(403)
      ).body.code,
    ).toBe('forbidden');
    await agent.post('/v1/auth/email/resend').set(XRW).expect(403);

    const [account] = await db.select({ id: accounts.id }).from(accounts).where(eq(accounts.shopId, owner.shopId));
    const [session] = await db
      .select({ expiresAt: sessions.expiresAt, impersonatedBy: sessions.impersonatedBy })
      .from(sessions)
      .where(and(eq(sessions.accountId, account!.id), isNotNull(sessions.impersonatedBy)));
    expect(session!.impersonatedBy).not.toBeNull();
    expect(session!.expiresAt.getTime() - Date.now()).toBeLessThanOrEqual(2 * 3_600_000);
    expect(session!.expiresAt.getTime() - Date.now()).toBeGreaterThan(2 * 3_600_000 - 60_000);
    expect(await audit(owner.shopId)).toEqual([{ action: 'impersonate', payload: null }]);

    // у самого владельца смена пароля по-прежнему работает (дальше 401 — неверный текущий пароль, не 403)
    await owner.agent
      .post('/v1/auth/password/change')
      .set(XRW)
      .send({ currentPassword: 'wrong-password', newPassword: 'new-password-1' })
      .expect(401);
  });

  it('вход: больше 10 в минуту с одного адреса — 429', async () => {
    const agent = browser(t);
    let response = await login(agent, 'support@example.com', 'wrong-password');
    for (let i = 0; i < 15 && response.status !== 429; i++) {
      response = await login(agent, 'support@example.com', 'wrong-password');
    }
    expect(response.status).toBe(429);
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  });
});
