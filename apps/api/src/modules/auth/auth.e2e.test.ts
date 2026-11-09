import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, TEST_ADMIN_URL, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { accounts, authTokens, shops } from '../../core/db/schema/index.js';

const PASSWORD = 'correct-horse-1';
const XRW = { 'X-Requested-With': 'XMLHttpRequest' };

/** Отдельное приложение со своей базой на каждый блок: счётчики ограничения частоты не мешают друг другу. */
function useApp() {
  const ref = {} as { t: TestApp };
  beforeAll(async () => {
    ref.t = await createTestApp();
  });
  afterAll(async () => {
    await ref.t?.close();
  });
  return ref;
}

/** Браузер: хранит cookie между запросами. */
const browser = (t: TestApp) => request.agent(t.app.getHttpServer());

const register = (agent: ReturnType<typeof browser>, email: string, password = PASSWORD) =>
  agent.post('/v1/auth/register').set(XRW).send({ email, password });

const login = (agent: ReturnType<typeof browser>, email: string, password = PASSWORD) =>
  agent.post('/v1/auth/login').set(XRW).send({ email, password });

/** Токен из ссылки последнего письма. */
function tokenFromLastMail(t: TestApp, path: string): string {
  const mail = t.mails.at(-1);
  const match = mail?.text.match(new RegExp(`${TEST_ADMIN_URL}${path}\\?token=([\\w-]+)`));
  if (!match) throw new Error(`В письме нет ссылки ${path}`);
  return match[1]!;
}

describe('регистрация, вход, выход', () => {
  const app = useApp();

  it('регистрация — 201, магазин-черновик, cookie sid, письмо со ссылкой', async () => {
    const agent = browser(app.t);
    const res = await register(agent, 'New.Shop@Example.com').expect(201);
    expect(res.body).toMatchObject({
      account: { email: 'new.shop@example.com', emailVerified: false, impersonated: false },
      shop: { name: null, subdomain: null, status: 'draft', setupCompleted: false },
    });
    const cookie = String(res.headers['set-cookie']);
    expect(cookie).toMatch(/^sid=[\w-]{43};/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(app.t.mails.at(-1)).toMatchObject({ to: 'new.shop@example.com', subject: 'Подтвердите почту' });

    const me = await agent.get('/v1/auth/me').expect(200);
    expect(me.body.account.id).toBe(res.body.account.id);
  });

  it('почта занята (без учёта регистра) — 409 email_taken', async () => {
    await register(browser(app.t), 'taken@example.com').expect(201);
    const res = await register(browser(app.t), 'TAKEN@example.com').expect(409);
    expect(res.body.code).toBe('email_taken');
  });

  it('короткий пароль и неверная почта — 422 по полям', async () => {
    const res = await register(browser(app.t), 'not-email', 'short').expect(422);
    expect(res.body.errors).toEqual([
      { field: 'email', code: 'invalid_format' },
      { field: 'password', code: 'too_short', params: { min: 8 } },
    ]);
  });

  it('без сессии — 401', async () => {
    const res = await request(app.t.app.getHttpServer()).get('/v1/auth/me').expect(401);
    expect(res.body.code).toBe('unauthorized');
  });

  it('вход: неверный пароль и неизвестная почта — одинаковый 401; верный — 200 и сессия', async () => {
    await register(browser(app.t), 'login@example.com').expect(201);
    expect((await login(browser(app.t), 'login@example.com', 'wrong-password')).status).toBe(401);
    expect((await login(browser(app.t), 'nobody@example.com')).status).toBe(401);

    const agent = browser(app.t);
    const res = await login(agent, 'LOGIN@example.com').expect(200);
    expect(res.body.account.email).toBe('login@example.com');
    await agent.get('/v1/auth/me').expect(200);
  });

  it('выход закрывает сессию и стирает cookie', async () => {
    const agent = browser(app.t);
    await register(agent, 'logout@example.com').expect(201);
    const res = await agent.post('/v1/auth/logout').set(XRW).expect(204);
    expect(String(res.headers['set-cookie'])).toMatch(/^sid=;/);
    await agent.get('/v1/auth/me').expect(401);
  });

  it('поддельная cookie — 401', async () => {
    await request(app.t.app.getHttpServer()).get('/v1/auth/me').set('Cookie', 'sid=fake').expect(401);
  });

  it('заблокированный магазин входит и видит свой статус', async () => {
    const agent = browser(app.t);
    const registered = await register(agent, 'blocked@example.com').expect(201);
    const { db, close } = connectTestDb(app.t.config.databaseUrl);
    await db.update(shops).set({ status: 'blocked' }).where(eq(shops.id, registered.body.shop.id));
    await close();
    const res = await login(browser(app.t), 'blocked@example.com').expect(200);
    expect(res.body.shop.status).toBe('blocked');
  });
});

describe('подтверждение почты', () => {
  const app = useApp();

  it('ссылка из письма подтверждает почту; повторно — 410 token_expired', async () => {
    const agent = browser(app.t);
    await register(agent, 'verify@example.com').expect(201);
    const token = tokenFromLastMail(app.t, '/verify-email');

    // ссылку можно открыть в другом браузере — сессия не нужна
    await request(app.t.app.getHttpServer()).post('/v1/auth/email/verify').set(XRW).send({ token }).expect(204);
    expect((await agent.get('/v1/auth/me')).body.account.emailVerified).toBe(true);

    const again = await agent.post('/v1/auth/email/verify').set(XRW).send({ token }).expect(410);
    expect(again.body.code).toBe('token_expired');
  });

  it('просроченная ссылка — 410', async () => {
    const agent = browser(app.t);
    const registered = await register(agent, 'expired@example.com').expect(201);
    const token = tokenFromLastMail(app.t, '/verify-email');
    const { db, close } = connectTestDb(app.t.config.databaseUrl);
    await db
      .update(authTokens)
      .set({ expiresAt: new Date(Date.now() - 1000) })
      .where(eq(authTokens.accountId, registered.body.account.id));
    await close();
    await agent.post('/v1/auth/email/verify').set(XRW).send({ token }).expect(410);
  });

  it('«Ещё раз» — новое письмо, прежняя ссылка гаснет', async () => {
    const agent = browser(app.t);
    await register(agent, 'resend@example.com').expect(201);
    const first = tokenFromLastMail(app.t, '/verify-email');
    await agent.post('/v1/auth/email/resend').set(XRW).expect(204);
    const second = tokenFromLastMail(app.t, '/verify-email');
    expect(second).not.toBe(first);
    await agent.post('/v1/auth/email/verify').set(XRW).send({ token: first }).expect(410);
    await agent.post('/v1/auth/email/verify').set(XRW).send({ token: second }).expect(204);
  });

  it('повторная отправка без сессии — 401', async () => {
    await request(app.t.app.getHttpServer()).post('/v1/auth/email/resend').set(XRW).expect(401);
  });
});

describe('пароль', () => {
  const app = useApp();

  it('«Забыли пароль»: одинаковый ответ; письмо — только существующей почте', async () => {
    await register(browser(app.t), 'forgot@example.com').expect(201);
    const before = app.t.mails.length;
    await browser(app.t).post('/v1/auth/password/forgot').set(XRW).send({ email: 'nobody@example.com' }).expect(204);
    expect(app.t.mails.length).toBe(before);
    await browser(app.t).post('/v1/auth/password/forgot').set(XRW).send({ email: 'Forgot@example.com' }).expect(204);
    expect(app.t.mails.at(-1)).toMatchObject({ to: 'forgot@example.com', subject: 'Новый пароль' });
  });

  it('новый пароль по ссылке: все сессии закрыты, вход с новым паролем', async () => {
    const agent = browser(app.t);
    await register(agent, 'reset@example.com').expect(201);
    await browser(app.t).post('/v1/auth/password/forgot').set(XRW).send({ email: 'reset@example.com' }).expect(204);
    const token = tokenFromLastMail(app.t, '/reset-password');

    await browser(app.t)
      .post('/v1/auth/password/reset')
      .set(XRW)
      .send({ token, password: 'brand-new-pass' })
      .expect(204);
    await agent.get('/v1/auth/me').expect(401);
    await login(browser(app.t), 'reset@example.com').expect(401);
    await login(browser(app.t), 'reset@example.com', 'brand-new-pass').expect(200);
    await browser(app.t).post('/v1/auth/password/reset').set(XRW).send({ token, password: 'other-pass-1' }).expect(410);
  });

  it('смена пароля: нужен текущий; другие сессии закрыты, текущая остаётся', async () => {
    const phone = browser(app.t);
    await register(phone, 'change@example.com').expect(201);
    const laptop = browser(app.t);
    await login(laptop, 'change@example.com').expect(200);

    const wrong = await phone
      .post('/v1/auth/password/change')
      .set(XRW)
      .send({ currentPassword: 'nope', newPassword: 'changed-pass-1' })
      .expect(401);
    expect(wrong.body.code).toBe('unauthorized');

    await phone
      .post('/v1/auth/password/change')
      .set(XRW)
      .send({ currentPassword: PASSWORD, newPassword: 'changed-pass-1' })
      .expect(204);
    await phone.get('/v1/auth/me').expect(200);
    await laptop.get('/v1/auth/me').expect(401);

    const { db, close } = connectTestDb(app.t.config.databaseUrl);
    const [account] = await db.select().from(accounts).where(eq(accounts.email, 'change@example.com'));
    await close();
    expect(account!.passwordHash).toMatch(/^\$argon2id\$/);
  });
});

describe('ограничение частоты входа', () => {
  const app = useApp();

  it('11-я попытка входа за минуту — 429 с Retry-After', async () => {
    for (let i = 0; i < 10; i++) await login(browser(app.t), 'flood@example.com').expect(401);
    const res = await login(browser(app.t), 'flood@example.com').expect(429);
    expect(res.body.code).toBe('rate_limited');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });
});
