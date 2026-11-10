import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { signUp, XRW, type Browser } from '../../../test/helpers/session.js';
import type { Db } from '../../core/db/index.js';
import { dailyStats, productPhotos, shops } from '../../core/db/schema/index.js';
import { addDays, localDate } from './lib/dates.js';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1';
const ZONE = 'Asia/Almaty';

type Shop = { agent: Browser; shopId: string; subdomain: string };

describe('статистика', () => {
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

  const today = () => localDate(new Date(), ZONE);
  const openShop = async (subdomain: string, status: 'published' | 'draft' = 'published'): Promise<Shop> => {
    const { agent, me } = await signUp(t, `${subdomain}@example.com`);
    await db
      .update(shops)
      .set({ subdomain, name: subdomain, whatsapp: '+77001234567', status, publishedAt: new Date() })
      .where(eq(shops.id, me.shop.id));
    return { agent, shopId: me.shop.id, subdomain };
  };
  const product = async (shop: Shop, name: string, isVisible = true): Promise<string> =>
    (
      await shop.agent
        .post('/v1/admin/products')
        .set(XRW)
        .send({ name, isVisible, variants: [{ price: 1000, stock: 1, values: [] }] })
        .expect(201)
    ).body.id;
  const track = (subdomain: string, body: object, ua: string | null = IPHONE) => {
    const req = request(t.app.getHttpServer()).post(`/v1/storefront/${subdomain}/events`).set(XRW);
    if (ua !== null) req.set('User-Agent', ua);
    return req.send(body);
  };
  const rows = async (shopId: string) =>
    (await db.select().from(dailyStats).where(eq(dailyStats.shopId, shopId)))
      .map(({ date, productId, views, orderClicks }) => ({ date, productId, views, orderClicks }))
      .sort((a, b) => String(a.productId).localeCompare(String(b.productId)));
  const stats = async (shop: Shop, period?: string) =>
    (await shop.agent.get(`/v1/admin/stats${period ? `?period=${period}` : ''}`).expect(200)).body;

  it('события: просмотр витрины и карточки, каждое нажатие «Заказать» — по дню магазина; роботы и чужое отброшены', async () => {
    const shop = await openShop('st-events');
    const other = await openShop('st-events-other');
    const item = await product(shop, 'Куртка');
    const hidden = await product(shop, 'Скрытая', false);
    const foreign = await product(other, 'Чужая');

    await track('st-events', { type: 'view' }).expect(204);
    await track('st-events', { type: 'view', productId: null }).expect(204);
    await track('st-events', { type: 'view', productId: item }).expect(204);
    await track('st-events', { type: 'order_click' }).expect(204);
    await track('st-events', { type: 'order_click', productId: item }).expect(204);
    // отброшено, ответ тот же
    await track('st-events', { type: 'view', productId: hidden }).expect(204);
    await track('st-events', { type: 'view', productId: foreign }).expect(204);
    await track('st-events', { type: 'view' }, 'Mozilla/5.0 (compatible; Googlebot/2.1)').expect(204);
    await track('st-events', { type: 'view' }, null).expect(204);
    await track('st-nobody', { type: 'view' }).expect(204);

    expect(await rows(shop.shopId)).toEqual(
      [
        { date: today(), productId: null, views: 2, orderClicks: 2 },
        { date: today(), productId: item, views: 1, orderClicks: 0 },
      ].sort((a, b) => String(a.productId).localeCompare(String(b.productId))),
    );
    expect(await rows(other.shopId)).toEqual([]);

    await track('st-events', { type: 'click' }).expect(422);
    await request(t.app.getHttpServer()).post('/v1/storefront/st-events/events').send({ type: 'view' }).expect(403);
  });

  it('закрытая витрина (черновик, снята, заблокирована) событий не считает', async () => {
    const draft = await openShop('st-draft', 'draft');
    await track('st-draft', { type: 'view' }).expect(204);
    const blocked = await openShop('st-blocked');
    await db.update(shops).set({ status: 'blocked' }).where(eq(shops.id, blocked.shopId));
    await track('st-blocked', { type: 'order_click' }).expect(204);
    expect(await rows(draft.shopId)).toEqual([]);
    expect(await rows(blocked.shopId)).toEqual([]);
  });

  it('getStats: неделя по умолчанию с пустыми днями, итоги и прошлый период, «чаще смотрят» с обложкой', async () => {
    const shop = await openShop('st-get');
    const jacket = await product(shop, 'Куртка');
    const dress = await product(shop, 'Платье');
    const hat = await product(shop, 'Шапка');
    const day = (offset: number) => addDays(today(), offset);
    await db.insert(dailyStats).values([
      { shopId: shop.shopId, date: day(0), productId: null, views: 10, orderClicks: 2 },
      { shopId: shop.shopId, date: day(0), productId: jacket, views: 5, orderClicks: 0 },
      { shopId: shop.shopId, date: day(-6), productId: dress, views: 7, orderClicks: 0 },
      { shopId: shop.shopId, date: day(-6), productId: null, views: 1, orderClicks: 1 },
      { shopId: shop.shopId, date: day(-3), productId: hat, views: 5, orderClicks: 0 },
      // прошлая неделя
      { shopId: shop.shopId, date: day(-7), productId: null, views: 4, orderClicks: 3 },
      { shopId: shop.shopId, date: day(-13), productId: jacket, views: 6, orderClicks: 0 },
      // за 30 дней, но не за неделю
      { shopId: shop.shopId, date: day(-20), productId: dress, views: 30, orderClicks: 0 },
    ]);
    await db.insert(productPhotos).values({
      shopId: shop.shopId,
      productId: jacket,
      position: 0,
      originalKey: 'orig/jacket',
      status: 'ready',
      width: 600,
      height: 800,
      sizes: { '320': 'j/320.webp', '640': 'j/640.webp', '1280': 'j/1280.webp' },
    });

    const week = await stats(shop);
    expect(week.period).toBe('7d');
    expect(week.totals).toEqual({ views: 28, orderClicks: 3 });
    expect(week.previousTotals).toEqual({ views: 10, orderClicks: 3 });
    expect(week.byDay.map((d: { date: string }) => d.date)).toEqual([-6, -5, -4, -3, -2, -1, 0].map(day));
    expect(week.byDay[0]).toEqual({ date: day(-6), views: 8, orderClicks: 1 });
    expect(week.byDay[1]).toEqual({ date: day(-5), views: 0, orderClicks: 0 });
    expect(week.byDay[6]).toEqual({ date: day(0), views: 15, orderClicks: 2 });
    expect(week.topProducts).toEqual([
      { productId: dress, name: 'Платье', views: 7, cover: null },
      {
        productId: jacket,
        name: 'Куртка',
        views: 5,
        cover: {
          width: 600,
          height: 800,
          sizes: expect.objectContaining({ '320': expect.stringContaining('j/320.webp') }),
        },
      },
      { productId: hat, name: 'Шапка', views: 5, cover: null },
    ]);

    const month = await stats(shop, '30d');
    expect(month.byDay).toHaveLength(30);
    expect(month.totals).toEqual({ views: 68, orderClicks: 6 });
    expect(month.previousTotals).toEqual({ views: 0, orderClicks: 0 });
    expect(month.topProducts[0]).toMatchObject({ productId: dress, views: 37 });

    // всё время — со дня регистрации магазина
    await db
      .update(shops)
      .set({ createdAt: new Date(Date.now() - 40 * 86_400_000) })
      .where(eq(shops.id, shop.shopId));
    const all = await stats(shop, 'all');
    expect(all.previousTotals).toBeNull();
    expect(all.byDay[0].date).toBe(localDate(new Date(Date.now() - 40 * 86_400_000), ZONE));
    expect(all.byDay.at(-1).date).toBe(today());
    expect(all.totals).toEqual({ views: 68, orderClicks: 6 });

    await shop.agent.get('/v1/admin/stats?period=1y').expect(422);
  });

  it('getStats нового магазина — нули, «всё время» — один день; чужая статистика не видна', async () => {
    const shop = await openShop('st-new');
    const other = await openShop('st-new-other');
    await track('st-new-other', { type: 'view' }).expect(204);
    expect(await stats(shop)).toEqual({
      period: '7d',
      totals: { views: 0, orderClicks: 0 },
      previousTotals: { views: 0, orderClicks: 0 },
      byDay: [-6, -5, -4, -3, -2, -1, 0].map((n) => ({ date: addDays(today(), n), views: 0, orderClicks: 0 })),
      topProducts: [],
    });
    expect((await stats(shop, 'all')).byDay).toEqual([{ date: today(), views: 0, orderClicks: 0 }]);
    expect((await stats(other)).totals).toEqual({ views: 1, orderClicks: 0 });
    await request(t.app.getHttpServer()).get('/v1/admin/stats').expect(401);
  });

  it('события: больше 60 в минуту с одного адреса — 429 с Retry-After', async () => {
    await openShop('st-flood');
    let response = await track('st-flood', { type: 'view' });
    for (let i = 0; i < 70 && response.status === 204; i++) response = await track('st-flood', { type: 'view' });
    expect(response.status).toBe(429);
    expect(response.body.code).toBe('rate_limited');
    expect(Number(response.headers['retry-after'])).toBeGreaterThan(0);
  });
});
