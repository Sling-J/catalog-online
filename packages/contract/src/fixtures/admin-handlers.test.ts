import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import type { Me, Problem, Shop } from '../gen/types.gen.js';
import { DEMO_ADMIN_PASSWORD, demoAdminHandlers, EXPIRED_EMAIL_TOKEN } from './admin-handlers.js';
import { createDemoShopData } from './demo-shop.js';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
// у каждого теста своя сессия: обработчики создаются заново
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const fresh = () => server.use(...demoAdminHandlers());
const call = (path: string, body?: unknown) =>
  fetch(`http://api.test/v1${path}`, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
const getJson = async <T>(path: string): Promise<T> => (await call(path)).json() as Promise<T>;

describe('моки админки', () => {
  it('по умолчанию вошёл владелец демо-магазина, мастер пройден', async () => {
    fresh();
    const me = await getJson<Me>('/auth/me');
    expect(me.shop).toMatchObject({ subdomain: 'aigerim-kids', status: 'published', setupCompleted: true });
  });

  it('счётчики товаров совпадают с чек-листом магазина', async () => {
    fresh();
    const [shop, counts] = await Promise.all([
      getJson<Shop>('/admin/shop'),
      getJson<{ all: number; noPhoto: number }>('/admin/products/counts'),
    ]);
    expect(counts.all).toBe(createDemoShopData().products.length);
    expect(shop.readiness).toMatchObject({ productCount: counts.all, productsWithoutPhoto: counts.noPhoto });
  });

  it('регистрация открывает сессию нового черновика с неподтверждённой почтой', async () => {
    fresh();
    const response = await call('/auth/register', { email: 'new@shop.kz', password: '12345678' });
    expect(response.status).toBe(201);
    const me = await getJson<Me>('/auth/me');
    expect(me.account).toMatchObject({ email: 'new@shop.kz', emailVerified: false });
    expect(me.shop).toMatchObject({ status: 'draft', setupCompleted: false });
    expect((await getJson<Shop>('/admin/shop')).readiness.productCount).toBe(0);
  });

  it('регистрация: занятая почта — 409, короткий пароль — 422 с полем', async () => {
    fresh();
    const taken = await call('/auth/register', { email: 'aigerim.kids@example.com', password: '12345678' });
    expect(taken.status).toBe(409);
    expect(((await taken.json()) as Problem).code).toBe('email_taken');
    const short = await call('/auth/register', { email: 'new@shop.kz', password: '123' });
    expect(short.status).toBe(422);
    expect(((await short.json()) as Problem).errors?.[0]).toMatchObject({ field: 'password', code: 'too_short' });
  });

  it('выход закрывает сессию, вход демо-паролем открывает', async () => {
    fresh();
    expect((await call('/auth/logout', {})).status).toBe(204);
    expect((await call('/auth/me')).status).toBe(401);
    expect((await call('/admin/shop')).status).toBe(401);
    expect((await call('/auth/login', { email: 'aigerim.kids@example.com', password: 'wrong' })).status).toBe(401);
    expect(
      (await call('/auth/login', { email: 'aigerim.kids@example.com', password: DEMO_ADMIN_PASSWORD })).status,
    ).toBe(200);
    expect((await call('/auth/me')).status).toBe(200);
  });
});

describe('моки админки: почта и пароль', () => {
  it('подтверждение почты: действующая ссылка — 204 и почта подтверждена, устаревшая — 410', async () => {
    fresh();
    await call('/auth/register', { email: 'new@shop.kz', password: '12345678' });
    expect((await call('/auth/email/verify', { token: EXPIRED_EMAIL_TOKEN })).status).toBe(410);
    expect((await call('/auth/email/verify', { token: 'abc' })).status).toBe(204);
    expect((await getJson<Me>('/auth/me')).account.emailVerified).toBe(true);
  });

  it('сброс пароля закрывает сессию; устаревшая ссылка — 410, короткий пароль — 422', async () => {
    fresh();
    expect((await call('/auth/password/forgot', { email: 'any@shop.kz' })).status).toBe(204);
    expect((await call('/auth/password/reset', { token: EXPIRED_EMAIL_TOKEN, password: '12345678' })).status).toBe(410);
    expect((await call('/auth/password/reset', { token: 'abc', password: '123' })).status).toBe(422);
    expect((await call('/auth/password/reset', { token: 'abc', password: '12345678' })).status).toBe(204);
    expect((await call('/auth/me')).status).toBe(401);
  });

  it('смена пароля: неверный текущий — 401, короткий новый — 422 по полю newPassword', async () => {
    fresh();
    expect((await call('/auth/password/change', { currentPassword: 'wrong', newPassword: '12345678' })).status).toBe(
      401,
    );
    const short = await call('/auth/password/change', { currentPassword: DEMO_ADMIN_PASSWORD, newPassword: '123' });
    expect(((await short.json()) as Problem).errors?.[0]).toMatchObject({ field: 'newPassword' });
    expect(
      (await call('/auth/password/change', { currentPassword: DEMO_ADMIN_PASSWORD, newPassword: '12345678' })).status,
    ).toBe(204);
  });
});

describe('моки админки: мастер', () => {
  const patch = (body: unknown) =>
    fetch('http://api.test/v1/admin/shop', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

  it('проверка адреса: свободен, занят, зарезервирован, неверный', async () => {
    fresh();
    const check = (value: string) =>
      getJson<{ available: boolean; reason: string | null }>(`/admin/shop/subdomain-availability?value=${value}`);
    expect(await check('my-shop')).toEqual({ available: true, reason: null });
    expect(await check('aigerim-kids')).toEqual({ available: false, reason: 'taken' });
    expect(await check('admin')).toEqual({ available: false, reason: 'reserved' });
    expect(await check('-x')).toEqual({ available: false, reason: 'invalid' });
  });

  it('шаги мастера сохраняются в магазине и в me; занятый адрес — 409', async () => {
    fresh();
    await call('/auth/register', { email: 'new@shop.kz', password: '12345678' });
    expect((await patch({ name: 'Моя лавка' })).status).toBe(200);
    expect((await patch({ subdomain: 'aigerim-kids' })).status).toBe(409);
    expect((await patch({ subdomain: 'moya-lavka', whatsapp: '+77001234567' })).status).toBe(200);
    expect((await patch({ setupCompleted: true })).status).toBe(200);
    const shop = await getJson<Shop>('/admin/shop');
    expect(shop).toMatchObject({ name: 'Моя лавка', subdomain: 'moya-lavka', whatsapp: '+77001234567' });
    expect((await getJson<Me>('/auth/me')).shop).toMatchObject({ subdomain: 'moya-lavka', setupCompleted: true });
  });

  it('логотип: ссылка на загрузку → PUT файла → логотип у магазина', async () => {
    fresh();
    await call('/auth/register', { email: 'new@shop.kz', password: '12345678' });
    const upload = (await (
      await call('/admin/uploads', { purpose: 'logo', fileName: 'logo.png', contentType: 'image/png', size: 3 })
    ).json()) as { uploadId: string; url: string };
    await fetch(upload.url, {
      method: 'PUT',
      headers: { 'Content-Type': 'image/png' },
      body: new Uint8Array([1, 2, 3]),
    });
    const res = await fetch('http://api.test/v1/admin/shop/logo', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uploadId: upload.uploadId }),
    });
    expect(((await res.json()) as Shop).logo?.sizes['320']).toMatch(/^data:image\/png;base64,/);
  });
});
