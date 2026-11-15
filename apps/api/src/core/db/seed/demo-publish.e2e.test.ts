import { DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD, DEMO_SHOP_ID } from '@catalog/contract/fixtures';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../../test/helpers/app.js';
import { connectTestDb } from '../../../../test/helpers/db.js';
import { signUp, XRW } from '../../../../test/helpers/session.js';
import type { Db } from '../index.js';
import { accounts, dailyStats, productPhotos, products, shops, staffUsers } from '../schema/index.js';
import { HIDDEN_SHOP_ID } from './demo-shop.js';
import { publishDemo } from './seed.js';

// Демо-магазин для лендинга на продакшене (`demo:publish`, storefront.md S13).
describe('demo:publish', () => {
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

  it('только демо-магазин, опубликован, с товарами и фото; без скрытого магазина, сотрудника и статистики', async () => {
    const keys = await publishDemo(db);
    const [shop] = await db.select().from(shops).where(eq(shops.id, DEMO_SHOP_ID));
    expect(shop).toMatchObject({ subdomain: 'aigerim-kids', status: 'published', setupCompleted: true });
    expect(await db.select().from(shops).where(eq(shops.id, HIDDEN_SHOP_ID))).toEqual([]);
    expect(await db.select().from(staffUsers)).toEqual([]);
    expect(await db.select().from(dailyStats).where(eq(dailyStats.shopId, DEMO_SHOP_ID))).toEqual([]);
    expect((await db.select().from(products).where(eq(products.shopId, DEMO_SHOP_ID))).length).toBeGreaterThan(0);
    const photos = await db.select().from(productPhotos).where(eq(productPhotos.shopId, DEMO_SHOP_ID));
    expect(keys.length).toBe(new Set(photos.flatMap((photo) => Object.values(photo.sizes ?? {}))).size);

    // витрина открыта покупателю
    const storefront = await request(t.app.getHttpServer()).get('/v1/storefront/aigerim-kids');
    expect(storefront.status).toBe(200);
  });

  it('войти в демо нельзя: пароль владельца случайный, пароль разработки не подходит', async () => {
    await publishDemo(db);
    const response = await request(t.app.getHttpServer())
      .post('/v1/auth/login')
      .set(XRW)
      .send({ email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD });
    expect(response.status).toBe(401);
    const [account] = await db.select().from(accounts).where(eq(accounts.shopId, DEMO_SHOP_ID));
    expect(account?.emailVerifiedAt).not.toBeNull();
  });

  it('повторный запуск возвращает демо к исходному и не трогает другие магазины', async () => {
    const other = await signUp(t, 'other@shop.test');
    await publishDemo(db);
    await db.update(shops).set({ name: 'Сломали', status: 'draft' }).where(eq(shops.id, DEMO_SHOP_ID));
    await db
      .insert(dailyStats)
      .values({ shopId: DEMO_SHOP_ID, date: '2026-11-14', productId: null, views: 5, orderClicks: 1 });

    await publishDemo(db);
    const [shop] = await db.select().from(shops).where(eq(shops.id, DEMO_SHOP_ID));
    expect(shop).toMatchObject({ name: 'Айгерим Kids', status: 'published' });
    expect(await db.select().from(dailyStats).where(eq(dailyStats.shopId, DEMO_SHOP_ID))).toEqual([]);
    expect(await db.select().from(shops).where(eq(shops.id, other.me.shop.id))).toHaveLength(1);
  });
});
