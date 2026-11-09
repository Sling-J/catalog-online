import { DEMO_ADMIN_PASSWORD, DEMO_SHOP_ID } from '@catalog/contract/fixtures';
import argon2 from 'argon2';
import { and, count, eq, isNull, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { connectTestDb, createTestDatabase, pgErrorCode } from '../../../test/helpers/db.js';
import * as s from './schema/index.js';
import { HIDDEN_SHOP_ID } from './seed/demo-shop.js';
import { seedDemo } from './seed/seed.js';
import type { Db } from './types.js';

const UNIQUE = '23505';
const FOREIGN_KEY = '23503';
const CHECK = '23514';

describe('схема базы и сид', () => {
  let db: Db;
  let close: () => Promise<void>;

  beforeAll(async () => {
    ({ db, close } = connectTestDb(await createTestDatabase()));
    await seedDemo(db);
  });
  afterAll(async () => {
    await close?.();
  });

  /** Новый магазин для проверок ограничений — данные демо не трогаем. */
  const newShop = async (subdomain: string) => {
    const [shop] = await db.insert(s.shops).values({ subdomain }).returning();
    return shop!;
  };
  const total = async (table: typeof s.products | typeof s.variants | typeof s.productPhotos, shopId: string) => {
    const [row] = await db.select({ n: count() }).from(table).where(eq(table.shopId, shopId));
    return row!.n;
  };

  describe('сид демо-магазина', () => {
    it('магазин опубликован, вход владельца — пароль из моков', async () => {
      const [shop] = await db.select().from(s.shops).where(eq(s.shops.id, DEMO_SHOP_ID));
      expect(shop).toMatchObject({
        subdomain: 'aigerim-kids',
        name: 'Айгерим Kids',
        status: 'published',
        setupCompleted: true,
      });
      const [account] = await db.select().from(s.accounts).where(eq(s.accounts.shopId, DEMO_SHOP_ID));
      expect(account!.email).toBe('aigerim.kids@example.com');
      expect(await argon2.verify(account!.passwordHash, DEMO_ADMIN_PASSWORD)).toBe(true);
    });

    it('каталог как на моках: 37 товаров, варианты, фото, свойства', async () => {
      expect(await total(s.products, DEMO_SHOP_ID)).toBe(37);
      expect(await total(s.variants, DEMO_SHOP_ID)).toBeGreaterThan(37);
      expect(await total(s.productPhotos, DEMO_SHOP_ID)).toBeGreaterThan(0);
      const attrs = await db.select().from(s.attributes).where(eq(s.attributes.shopId, DEMO_SHOP_ID));
      expect(attrs.map((attr) => attr.name).sort()).toEqual(['Размер обуви', 'Рост']);
      const [photo] = await db.select().from(s.productPhotos).limit(1);
      expect(photo!.originalKey).toMatch(/^demo\/[a-z0-9-]+\.jpg$/);
    });

    it('скрытый магазин — черновик', async () => {
      const [shop] = await db.select().from(s.shops).where(eq(s.shops.id, HIDDEN_SHOP_ID));
      expect(shop).toMatchObject({ subdomain: 'skrytyj-magazin', status: 'draft' });
    });

    it('статистика: 150 дней по витрине', async () => {
      const [row] = await db
        .select({ n: count() })
        .from(s.dailyStats)
        .where(and(eq(s.dailyStats.shopId, DEMO_SHOP_ID), isNull(s.dailyStats.productId)));
      expect(row!.n).toBe(150);
    });

    it('повторный запуск пересоздаёт демо и не трогает другие магазины', async () => {
      const other = await newShop('drugoj-magazin');
      await seedDemo(db);
      expect(await total(s.products, DEMO_SHOP_ID)).toBe(37);
      const [still] = await db.select().from(s.shops).where(eq(s.shops.id, other.id));
      expect(still).toBeDefined();
    });
  });

  describe('ограничения', () => {
    it('id по умолчанию — UUID v7', async () => {
      const shop = await newShop('uuid-v7');
      expect(shop.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-7/);
    });

    it('адрес витрины уникален; у новых магазинов его может не быть', async () => {
      expect(await pgErrorCode(db.insert(s.shops).values({ subdomain: 'aigerim-kids' }))).toBe(UNIQUE);
      await db.insert(s.shops).values([{}, {}]);
    });

    it('почта уникальна без учёта регистра', async () => {
      const shop = await newShop('pochta');
      const code = await pgErrorCode(
        db.insert(s.accounts).values({ shopId: shop.id, email: 'AIGERIM.KIDS@example.com', passwordHash: 'x' }),
      );
      expect(code).toBe(UNIQUE);
    });

    it('артикул уникален в магазине, в другом магазине может повториться', async () => {
      const [demoVariant] = await db.select().from(s.variants).where(eq(s.variants.shopId, DEMO_SHOP_ID)).limit(1);
      const [demoProduct] = await db.select().from(s.products).where(eq(s.products.id, demoVariant!.productId));
      const variant = { shopId: DEMO_SHOP_ID, productId: demoProduct!.id, sku: demoVariant!.sku, price: 100 };
      expect(await pgErrorCode(db.insert(s.variants).values(variant))).toBe(UNIQUE);

      const shop = await newShop('artikul');
      const [product] = await db
        .insert(s.products)
        .values({ shopId: shop.id, name: 'Товар', slug: 'tovar', shortId: 'a0001' })
        .returning();
      await db.insert(s.variants).values({ ...variant, shopId: shop.id, productId: product!.id });
    });

    it('цена и остаток не отрицательные, порог «мало» 1–50', async () => {
      const [product] = await db.select().from(s.products).where(eq(s.products.shopId, DEMO_SHOP_ID)).limit(1);
      const base = { shopId: DEMO_SHOP_ID, productId: product!.id, price: 100 };
      expect(await pgErrorCode(db.insert(s.variants).values({ ...base, sku: 'neg-price', price: -1 }))).toBe(CHECK);
      expect(await pgErrorCode(db.insert(s.variants).values({ ...base, sku: 'neg-stock', stock: -1 }))).toBe(CHECK);
      expect(
        await pgErrorCode(db.update(s.shops).set({ lowStockThreshold: 0 }).where(eq(s.shops.id, DEMO_SHOP_ID))),
      ).toBe(CHECK);
    });

    it('имя категории уникально среди соседей без учёта регистра', async () => {
      const shop = await newShop('kategorii');
      const [root] = await db
        .insert(s.categories)
        .values({ shopId: shop.id, name: 'Девочки', path: 'Девочки' })
        .returning();
      expect(
        await pgErrorCode(db.insert(s.categories).values({ shopId: shop.id, name: 'девочки', path: 'девочки' })),
      ).toBe(UNIQUE);
      // то же имя у другого родителя — можно
      await db
        .insert(s.categories)
        .values({ shopId: shop.id, parentId: root!.id, name: 'Девочки', path: 'Девочки / Девочки' });
    });

    it('категорию с подкатегориями удалить нельзя, товары удалённой — без категории', async () => {
      const shop = await newShop('udalenie');
      const [root] = await db
        .insert(s.categories)
        .values({ shopId: shop.id, name: 'Обувь', path: 'Обувь' })
        .returning();
      const [child] = await db
        .insert(s.categories)
        .values({ shopId: shop.id, parentId: root!.id, name: 'Кеды', path: 'Обувь / Кеды' })
        .returning();
      expect(await pgErrorCode(db.delete(s.categories).where(eq(s.categories.id, root!.id)))).toBe(FOREIGN_KEY);

      const [product] = await db
        .insert(s.products)
        .values({ shopId: shop.id, categoryId: child!.id, name: 'Кеды', slug: 'kedy', shortId: 'b0001' })
        .returning();
      await db.delete(s.categories).where(eq(s.categories.id, child!.id));
      const [after] = await db.select().from(s.products).where(eq(s.products.id, product!.id));
      expect(after!.categoryId).toBeNull();
    });

    it('удаление свойства снимает его значения с вариантов, варианты остаются', async () => {
      const [used] = await db.select().from(s.variantValues).limit(1);
      const [value] = await db.select().from(s.attributeValues).where(eq(s.attributeValues.id, used!.attributeValueId));
      await db.delete(s.attributes).where(eq(s.attributes.id, value!.attributeId));
      const left = await db.select().from(s.variantValues).where(eq(s.variantValues.attributeValueId, value!.id));
      expect(left).toEqual([]);
      const [variant] = await db.select().from(s.variants).where(eq(s.variants.id, used!.variantId));
      expect(variant).toBeDefined();
    });

    it('у магазина один незаконченный импорт', async () => {
      const shop = await newShop('import');
      const file = { shopId: shop.id, fileKey: 'k', fileName: 'ostatki.xlsx' };
      const [first] = await db.insert(s.imports).values(file).returning();
      expect(await pgErrorCode(db.insert(s.imports).values(file))).toBe(UNIQUE);
      await db.update(s.imports).set({ status: 'done' }).where(eq(s.imports.id, first!.id));
      await db.insert(s.imports).values(file);
    });

    it('счётчики статистики: upsert по дню, в том числе для витрины в целом (product_id = null)', async () => {
      const shop = await newShop('statistika');
      const hit = () =>
        db
          .insert(s.dailyStats)
          .values({ shopId: shop.id, date: '2026-11-09', productId: null, views: 1 })
          .onConflictDoUpdate({
            target: [s.dailyStats.shopId, s.dailyStats.date, s.dailyStats.productId],
            set: { views: sql`${s.dailyStats.views} + 1` },
          });
      await hit();
      await hit();
      const rows = await db.select().from(s.dailyStats).where(eq(s.dailyStats.shopId, shop.id));
      expect(rows).toEqual([expect.objectContaining({ views: 2, productId: null })]);
    });

    it('удаление магазина удаляет всё его содержимое', async () => {
      await db.delete(s.shops).where(eq(s.shops.id, DEMO_SHOP_ID));
      expect(await total(s.products, DEMO_SHOP_ID)).toBe(0);
      expect(await total(s.variants, DEMO_SHOP_ID)).toBe(0);
      const [stats] = await db.select({ n: count() }).from(s.dailyStats).where(eq(s.dailyStats.shopId, DEMO_SHOP_ID));
      expect(stats!.n).toBe(0);
    });
  });
});
