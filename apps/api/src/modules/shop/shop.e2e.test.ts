import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { signUp, XRW, type Browser } from '../../../test/helpers/session.js';
import { PreviewTokens } from '../../core/auth/index.js';
import type { Db } from '../../core/db/index.js';
import { accounts, productPhotos, products, shops } from '../../core/db/schema/index.js';

const WIZARD = { name: 'Айгерим Kids', subdomain: 'aigerim-kids', whatsapp: '+77001234567', setupCompleted: true };

describe('магазин', () => {
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

  const patch = (agent: Browser, body: object) => agent.patch('/v1/admin/shop').set(XRW).send(body);
  const addProduct = async (shopId: string, shortId: string, isVisible = true) => {
    const [product] = await db
      .insert(products)
      .values({ shopId, name: 'Куртка', slug: 'kurtka', shortId, isVisible })
      .returning();
    return product!;
  };
  const verifyEmail = (accountId: string) =>
    db.update(accounts).set({ emailVerifiedAt: new Date() }).where(eq(accounts.id, accountId));

  it('без сессии — 401', async () => {
    await request(t.app.getHttpServer()).get('/v1/admin/shop').expect(401);
  });

  it('новый магазин — черновик с пустыми полями мастера и чек-листом', async () => {
    const { agent } = await signUp(t, 'new@example.com');
    const res = await agent.get('/v1/admin/shop').expect(200);
    expect(res.body).toMatchObject({
      status: 'draft',
      name: null,
      subdomain: null,
      whatsapp: null,
      logo: null,
      timezone: 'Asia/Almaty',
      stockDisplay: 'levels',
      lowStockThreshold: 2,
      showOutOfStock: false,
      publishedAt: null,
      readiness: { settingsFilled: false, productCount: 0, productsWithoutPhoto: 0, canPublish: false },
    });
  });

  it('мастер: название, адрес, WhatsApp — сохраняются и видны в me', async () => {
    const { agent } = await signUp(t, 'wizard@example.com');
    const res = await patch(agent, WIZARD).expect(200);
    expect(res.body).toMatchObject({ name: 'Айгерим Kids', subdomain: 'aigerim-kids', whatsapp: '+77001234567' });
    const me = await agent.get('/v1/auth/me').expect(200);
    expect(me.body.shop).toMatchObject({ name: 'Айгерим Kids', subdomain: 'aigerim-kids', setupCompleted: true });

    // частичное обновление не трогает остальное
    const again = await patch(agent, { description: 'Детская одежда' }).expect(200);
    expect(again.body).toMatchObject({ name: 'Айгерим Kids', description: 'Детская одежда' });
    const cleared = await patch(agent, { description: '' }).expect(200);
    expect(cleared.body.description).toBeNull();
  });

  it('адрес витрины: занят — 409, служебный — 409, неверный — 422; свой — можно сохранить снова', async () => {
    const { agent } = await signUp(t, 'second@example.com');
    expect((await patch(agent, { subdomain: 'aigerim-kids' }).expect(409)).body.code).toBe('subdomain_taken');
    expect((await patch(agent, { subdomain: 'admin' }).expect(409)).body.code).toBe('subdomain_reserved');
    const invalid = await patch(agent, { subdomain: 'Bad_Name' }).expect(422);
    expect(invalid.body.errors).toEqual([{ field: 'subdomain', code: 'invalid_format' }]);
    await patch(agent, { subdomain: 'vtoroj' }).expect(200);
    await patch(agent, { subdomain: 'vtoroj' }).expect(200);
  });

  it('проверка адреса на лету', async () => {
    const { agent } = await signUp(t, 'check@example.com');
    await patch(agent, { subdomain: 'moj-adres' }).expect(200);
    const check = async (value: string) =>
      (await agent.get('/v1/admin/shop/subdomain-availability').query({ value }).expect(200)).body;
    expect(await check('svobodnyj')).toEqual({ available: true, reason: null });
    expect(await check('moj-adres')).toEqual({ available: true, reason: null });
    expect(await check('aigerim-kids')).toEqual({ available: false, reason: 'taken' });
    expect(await check('www')).toEqual({ available: false, reason: 'reserved' });
    expect(await check('x')).toEqual({ available: false, reason: 'invalid' });
  });

  it('настройки: график с ошибкой — 422 по дню; порог «мало» вне 1–50 — 422', async () => {
    const { agent } = await signUp(t, 'settings@example.com');
    const schedule = {
      mon: { open: '10:00', close: '20:00' },
      tue: { open: '10:00', close: '09:00' },
      wed: null,
      thu: null,
      fri: null,
      sat: null,
      sun: null,
    };
    const bad = await patch(agent, { schedule }).expect(422);
    expect(bad.body.errors).toEqual([{ field: 'schedule.tue.close', code: 'out_of_range' }]);
    const threshold = await patch(agent, { lowStockThreshold: 0 }).expect(422);
    expect(threshold.body.errors).toEqual([{ field: 'lowStockThreshold', code: 'out_of_range', params: { min: 1 } }]);

    const res = await patch(agent, {
      address: 'Шымкент, ТЦ «Мега»',
      schedule: { ...schedule, tue: null },
      stockDisplay: 'exact',
      lowStockThreshold: 5,
      showOutOfStock: true,
    }).expect(200);
    expect(res.body).toMatchObject({ stockDisplay: 'exact', lowStockThreshold: 5, showOutOfStock: true });
    expect(res.body.readiness.settingsFilled).toBe(true);
  });

  it('публикация: без товара и подтверждённой почты — 409 shop_not_ready; потом — опубликован', async () => {
    const { agent, me } = await signUp(t, 'publish@example.com');
    await patch(agent, { ...WIZARD, subdomain: 'publikaciya' }).expect(200);
    expect((await agent.post('/v1/admin/shop/publish').set(XRW).expect(409)).body.code).toBe('shop_not_ready');

    // скрытый товар не считается
    await addProduct(me.shop.id, 'p0001', false);
    await verifyEmail(me.account.id);
    await agent.post('/v1/admin/shop/publish').set(XRW).expect(409);

    const product = await addProduct(me.shop.id, 'p0002');
    await db.insert(productPhotos).values({ shopId: me.shop.id, productId: product.id, originalKey: 'k' });
    const res = await agent.post('/v1/admin/shop/publish').set(XRW).expect(200);
    expect(res.body.status).toBe('published');
    expect(res.body.publishedAt).toEqual(expect.any(String));
    expect(res.body.readiness).toMatchObject({ productCount: 2, productsWithoutPhoto: 1, canPublish: true });
    expect((await agent.get('/v1/auth/me')).body.shop.status).toBe('published');

    const off = await agent.post('/v1/admin/shop/unpublish').set(XRW).expect(200);
    expect(off.body.status).toBe('draft');
  });

  it('почта не подтверждена — опубликовать нельзя, даже если всё остальное готово', async () => {
    const { agent, me } = await signUp(t, 'unverified@example.com');
    await patch(agent, { ...WIZARD, subdomain: 'nepodtverzhden' }).expect(200);
    await addProduct(me.shop.id, 'u0001');
    const shop = await agent.get('/v1/admin/shop').expect(200);
    expect(shop.body.readiness.canPublish).toBe(true);
    expect((await agent.post('/v1/admin/shop/publish').set(XRW).expect(409)).body.code).toBe('shop_not_ready');
  });

  it('заблокированный: опубликовать — 409 shop_blocked, снятие статус не меняет', async () => {
    const { agent, me } = await signUp(t, 'blocked@example.com');
    await db.update(shops).set({ status: 'blocked' }).where(eq(shops.id, me.shop.id));
    expect((await agent.post('/v1/admin/shop/publish').set(XRW).expect(409)).body.code).toBe('shop_blocked');
    expect((await agent.post('/v1/admin/shop/unpublish').set(XRW).expect(200)).body.status).toBe('blocked');
  });

  it('логотип: загрузок ещё нет — 422 upload_not_found; удаление — 204', async () => {
    const { agent } = await signUp(t, 'logo@example.com');
    const res = await agent
      .put('/v1/admin/shop/logo')
      .set(XRW)
      .send({ uploadId: '0192d000-0000-7000-8000-000000000001' })
      .expect(422);
    expect(res.body.code).toBe('upload_not_found');
    await agent.delete('/v1/admin/shop/logo').set(XRW).expect(204);
  });

  it('токен превью — на 30 минут, подписан для своего магазина', async () => {
    const { agent, me } = await signUp(t, 'preview@example.com');
    const res = await agent.post('/v1/admin/preview-token').set(XRW).expect(201);
    expect(Date.parse(res.body.expiresAt) - Date.now()).toBeGreaterThan(29 * 60_000);
    expect(t.app.get(PreviewTokens).verify(res.body.token)).toBe(me.shop.id);
  });

  it('у каждого магазина свои настройки', async () => {
    const a = await signUp(t, 'shop-a@example.com');
    const b = await signUp(t, 'shop-b@example.com');
    await patch(a.agent, { name: 'Магазин А' }).expect(200);
    expect((await b.agent.get('/v1/admin/shop')).body.name).toBeNull();
  });
});
