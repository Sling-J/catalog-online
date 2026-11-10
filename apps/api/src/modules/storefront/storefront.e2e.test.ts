import type { StorefrontProductCard } from '@catalog/contract';
import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { signUp, XRW, type Browser } from '../../../test/helpers/session.js';
import { PREVIEW_TOKEN_TTL_MS, PreviewTokens } from '../../core/auth/index.js';
import type { Db } from '../../core/db/index.js';
import { productPhotos, shops } from '../../core/db/schema/index.js';

const NO_SUCH = '0192d000-0000-7000-8000-00000000ffff';

type Variant = { price: number; stock: number; values?: { attributeId: string; value: string }[] };
type Created = { id: string; shortId: string; slug: string; variants: { id: string }[] };
type Shop = { agent: Browser; shopId: string; subdomain: string };

describe('витрина', () => {
  let t: TestApp;
  let db: Db;
  let closeDb: () => Promise<void>;
  let anon: ReturnType<typeof request>;

  beforeAll(async () => {
    t = await createTestApp();
    ({ db, close: closeDb } = connectTestDb(t.config.databaseUrl));
    anon = request(t.app.getHttpServer());
  });
  afterAll(async () => {
    await closeDb?.();
    await t?.close();
  });

  /** Опубликованный магазин с адресом витрины (публикацию с проверками проверяет `shop.e2e.test.ts`). */
  const openShop = async (subdomain: string, settings: Partial<typeof shops.$inferInsert> = {}): Promise<Shop> => {
    const { agent, me } = await signUp(t, `${subdomain}@example.com`);
    await db
      .update(shops)
      .set({
        subdomain,
        name: `Магазин ${subdomain}`,
        whatsapp: '+77001234567',
        address: 'Алматы, Абая 1',
        status: 'published',
        publishedAt: new Date(),
        ...settings,
      })
      .where(eq(shops.id, me.shop.id));
    return { agent, shopId: me.shop.id, subdomain };
  };
  const setShop = (shop: Shop, values: Partial<typeof shops.$inferInsert>) =>
    db.update(shops).set(values).where(eq(shops.id, shop.shopId));

  const product = async (
    shop: Shop,
    name: string,
    variants: Variant[],
    extra: { categoryId?: string; isVisible?: boolean; description?: string } = {},
  ): Promise<Created> =>
    (
      await shop.agent
        .post('/v1/admin/products')
        .set(XRW)
        .send({ name, variants: variants.map((v) => ({ values: [], ...v })), ...extra })
        .expect(201)
    ).body;
  const category = async (shop: Shop, name: string, parentId: string | null = null): Promise<string> =>
    (await shop.agent.post('/v1/admin/categories').set(XRW).send({ name, parentId }).expect(201)).body.id;
  const attribute = async (shop: Shop, name: string, values: string[], inFilters = true) => {
    const { body } = await shop.agent
      .post('/v1/admin/attributes')
      .set(XRW)
      .send({ name, values, inFilters })
      .expect(201);
    return {
      id: body.id as string,
      value: Object.fromEntries((body.values as { id: string; value: string }[]).map((v) => [v.value, v.id])),
    };
  };
  const photo = (shop: Shop, productId: string, position: number, status: 'ready' | 'processing' = 'ready') =>
    db.insert(productPhotos).values({
      shopId: shop.shopId,
      productId,
      position,
      originalKey: `orig/${productId}/${position}`,
      status,
      ...(status === 'ready'
        ? {
            width: 800,
            height: 1000,
            sizes: {
              '320': `p/${position}/320.webp`,
              '640': `p/${position}/640.webp`,
              '1280': `p/${position}/1280.webp`,
            },
          }
        : {}),
    });

  const get = (path: string) => anon.get(`/v1/storefront/${path}`);
  const names = (items: StorefrontProductCard[]) => items.map((item) => item.name);
  const list = async (subdomain: string, query = '') =>
    (await get(`${subdomain}/products${query}`).expect(200)).body as {
      items: StorefrontProductCard[];
      nextCursor: string | null;
    };

  describe('магазин и доступ', () => {
    it('опубликованный — открыт; несуществующий и ни разу не публиковавшийся — 404', async () => {
      const shop = await openShop('sf-open', { instagram: 'sf_open', howToFind: 'Вход со двора' });
      const { body } = await get('sf-open').expect(200);
      expect(body).toEqual({
        subdomain: 'sf-open',
        name: 'Магазин sf-open',
        logo: null,
        description: null,
        address: 'Алматы, Абая 1',
        howToFind: 'Вход со двора',
        whatsapp: '+77001234567',
        instagram: 'sf_open',
        schedule: { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null },
        timezone: 'Asia/Almaty',
        stockDisplay: 'levels',
        isPreview: false,
      });
      // токен превью у опубликованного не включает плашку «Черновик»
      const { body: token } = await shop.agent.post('/v1/admin/preview-token').set(XRW).expect(201);
      expect((await get(`sf-open?preview=${token.token}`).expect(200)).body.isPreview).toBe(false);

      expect((await get('sf-nobody').expect(404)).body.code).toBe('not_found');
      expect((await get('Not_A_Subdomain!').expect(404)).body.code).toBe('not_found');
      await openShop('sf-never', { status: 'draft', publishedAt: null });
      await get('sf-never').expect(404);
      await get('sf-never/products').expect(404);
    });

    it('черновик открывается токеном превью своего магазина; чужой, просроченный и поддельный — нет', async () => {
      const shop = await openShop('sf-draft', { status: 'draft', publishedAt: null });
      const other = await openShop('sf-draft-other');
      const item = await product(shop, 'Платье', [{ price: 5000, stock: 1 }]);
      const own = (await shop.agent.post('/v1/admin/preview-token').set(XRW).expect(201)).body.token as string;
      const foreign = (await other.agent.post('/v1/admin/preview-token').set(XRW).expect(201)).body.token as string;
      const expired = t.app.get(PreviewTokens).issue(shop.shopId, Date.now() - PREVIEW_TOKEN_TTL_MS - 1000).token;

      expect((await get(`sf-draft?preview=${own}`).expect(200)).body.isPreview).toBe(true);
      expect(names((await list('sf-draft', `?preview=${own}`)).items)).toEqual(['Платье']);
      await get(`sf-draft/products/${item.shortId}?preview=${own}`).expect(200);
      for (const bad of [foreign, expired, `${own}x`, 'garbage']) {
        await get(`sf-draft?preview=${encodeURIComponent(bad)}`).expect(404);
        await get(`sf-draft/products?preview=${encodeURIComponent(bad)}`).expect(404);
      }
    });

    it('снятый с публикации — 410 shop_hidden с контактами; заблокированный — 410 shop_blocked и превью не открывает', async () => {
      const shop = await openShop('sf-hidden');
      const item = await product(shop, 'Платье', [{ price: 5000, stock: 1 }]);
      await shop.agent.post('/v1/admin/shop/unpublish').set(XRW).expect(200);
      const { body, headers } = await get('sf-hidden').expect(410);
      expect(headers['content-type']).toContain('application/problem+json');
      expect(body).toMatchObject({
        status: 410,
        code: 'shop_hidden',
        shop: {
          name: 'Магазин sf-hidden',
          logo: null,
          address: 'Алматы, Абая 1',
          whatsapp: '+77001234567',
          schedule: { mon: null },
          timezone: 'Asia/Almaty',
        },
      });
      await get('sf-hidden/categories').expect(404);
      await get(`sf-hidden/products/${item.shortId}`).expect(404);
      const token = (await shop.agent.post('/v1/admin/preview-token').set(XRW).expect(201)).body.token as string;
      expect((await get(`sf-hidden?preview=${token}`).expect(200)).body.isPreview).toBe(true);

      await setShop(shop, { status: 'blocked' });
      expect((await get('sf-hidden').expect(410)).body.code).toBe('shop_blocked');
      expect((await get(`sf-hidden?preview=${token}`).expect(410)).body.code).toBe('shop_blocked');
      await get(`sf-hidden/products?preview=${token}`).expect(404);
    });
  });

  describe('каталог', () => {
    it('категории: только с товарами витрины, у родителя — с подкатегориями, порядок витрины', async () => {
      const shop = await openShop('sf-cats');
      const girls = await category(shop, 'Девочки');
      const boys = await category(shop, 'Мальчики');
      const empty = await category(shop, 'Пустая');
      const jackets = await category(shop, 'Куртки', girls);
      const dresses = await category(shop, 'Платья', girls);
      const shoes = await category(shop, 'Обувь', boys);
      await product(shop, 'Куртка', [{ price: 1, stock: 2 }], { categoryId: jackets });
      await product(shop, 'Куртка 2', [{ price: 1, stock: 1 }], { categoryId: jackets });
      await product(shop, 'Боди', [{ price: 1, stock: 1 }], { categoryId: girls });
      await product(shop, 'Скрытое платье', [{ price: 1, stock: 1 }], { categoryId: dresses, isVisible: false });
      await product(shop, 'Кеды', [{ price: 1, stock: 0 }], { categoryId: shoes });
      expect((await get('sf-cats/categories').expect(200)).body).toEqual([
        {
          id: girls,
          name: 'Девочки',
          productCount: 3,
          children: [{ id: jackets, name: 'Куртки', productCount: 2, children: [] }],
        },
      ]);
      expect(empty).toBeTruthy();

      await setShop(shop, { showOutOfStock: true });
      const tree = (await get('sf-cats/categories').expect(200)).body;
      expect(tree.map((c: { name: string; productCount: number }) => [c.name, c.productCount])).toEqual([
        ['Девочки', 3],
        ['Мальчики', 1],
      ]);
    });

    it('сетка: видимые с наличием, цена по вариантам в наличии, «мало», обложка — первое готовое фото', async () => {
      const shop = await openShop('sf-grid', { lowStockThreshold: 3 });
      const plain = await product(shop, 'Футболка', [{ price: 4000, stock: 10 }]);
      const rost = await attribute(shop, 'Рост', ['98', '104', '110']);
      const sized = (value: string, price: number, stock: number) => ({
        price,
        stock,
        values: [{ attributeId: rost.id, value }],
      });
      const range = await product(shop, 'Куртка', [
        sized('98', 9000, 0),
        sized('104', 12000, 1),
        sized('110', 15000, 1),
      ]);
      await product(shop, 'Скрытая', [{ price: 1, stock: 5 }], { isVisible: false });
      await product(shop, 'Раскупленная', [{ price: 1, stock: 0 }]);
      await photo(shop, plain.id, 0, 'processing');
      await photo(shop, plain.id, 1);

      const { items, nextCursor } = await list('sf-grid');
      expect(nextCursor).toBeNull();
      expect(items).toEqual([
        {
          id: range.id,
          shortId: range.shortId,
          slug: range.slug,
          name: 'Куртка',
          price: 12000,
          priceVaries: true,
          cover: null,
          stockLevel: 'low',
        },
        {
          id: plain.id,
          shortId: plain.shortId,
          slug: plain.slug,
          name: 'Футболка',
          price: 4000,
          priceVaries: false,
          cover: {
            width: 800,
            height: 1000,
            sizes: {
              '320': expect.stringContaining('p/1/320.webp'),
              '640': expect.stringContaining('p/1/640.webp'),
              '1280': expect.stringContaining('p/1/1280.webp'),
            },
          },
          stockLevel: 'in',
        },
      ]);
    });

    it('закончившиеся: только если магазин показывает, в конце при любом порядке и без фильтров по вариантам', async () => {
      const shop = await openShop('sf-out', { showOutOfStock: true });
      const rost = await attribute(shop, 'Рост', ['98', '104']);
      await product(shop, 'Раскупленное дешёвое', [
        { price: 1000, stock: 0, values: [{ attributeId: rost.id, value: '98' }] },
      ]);
      await product(shop, 'Дорогое', [{ price: 9000, stock: 1, values: [{ attributeId: rost.id, value: '98' }] }]);
      await product(shop, 'Дешёвое', [{ price: 2000, stock: 1, values: [{ attributeId: rost.id, value: '104' }] }]);
      await product(shop, 'Раскупленное дорогое', [{ price: 20000, stock: 0 }]);

      expect(names((await list('sf-out')).items)).toEqual([
        'Дешёвое',
        'Дорогое',
        'Раскупленное дорогое',
        'Раскупленное дешёвое',
      ]);
      expect(names((await list('sf-out', '?sort=price_asc')).items)).toEqual([
        'Дешёвое',
        'Дорогое',
        'Раскупленное дешёвое',
        'Раскупленное дорогое',
      ]);
      expect(names((await list('sf-out', '?sort=price_desc')).items)).toEqual([
        'Дорогое',
        'Дешёвое',
        'Раскупленное дорогое',
        'Раскупленное дешёвое',
      ]);
      const out = (await list('sf-out')).items.at(-1)!;
      expect(out).toMatchObject({ stockLevel: 'out', price: 1000, priceVaries: false });
      expect(names((await list('sf-out', '?q=раскуп')).items)).toEqual([
        'Раскупленное дорогое',
        'Раскупленное дешёвое',
      ]);
      expect(names((await list('sf-out', `?values=${rost.value['98']}`)).items)).toEqual(['Дорогое']);
      expect(names((await list('sf-out', '?priceMax=100000')).items)).toEqual(['Дешёвое', 'Дорогое']);
      expect((await get('sf-out/facets').expect(200)).body.total).toBe(4);
      expect((await get('sf-out/facets?priceMin=0').expect(200)).body.total).toBe(2);

      await setShop(shop, { showOutOfStock: false });
      expect(names((await list('sf-out')).items)).toEqual(['Дешёвое', 'Дорогое']);
      expect((await get('sf-out/facets').expect(200)).body.total).toBe(2);
    });

    it('курсор: страницы по порядку без повторов, включая закончившиеся; чужой порядок или мусор — 422', async () => {
      const shop = await openShop('sf-pages', { showOutOfStock: true });
      const prices = [3000, 1000, 3000, 2000, 5000, 1000];
      for (const [i, price] of prices.entries()) await product(shop, `Товар ${i}`, [{ price, stock: 1 }]);
      await product(shop, 'Раскупленный 1', [{ price: 100, stock: 0 }]);
      await product(shop, 'Раскупленный 2', [{ price: 100, stock: 0 }]);

      for (const sort of ['new', 'price_asc', 'price_desc']) {
        const all = names((await list('sf-pages', `?sort=${sort}`)).items);
        const paged: string[] = [];
        let cursor: string | null = null;
        do {
          const page: { items: StorefrontProductCard[]; nextCursor: string | null } = await list(
            'sf-pages',
            `?sort=${sort}&limit=3${cursor ? `&cursor=${cursor}` : ''}`,
          );
          paged.push(...names(page.items));
          cursor = page.nextCursor;
        } while (cursor);
        expect(paged, sort).toEqual(all);
        expect(all).toHaveLength(8);
        expect(all.slice(-2).sort()).toEqual(['Раскупленный 1', 'Раскупленный 2']);
      }

      const { nextCursor } = await list('sf-pages', '?limit=2');
      const wrong = await get(`sf-pages/products?sort=price_asc&cursor=${nextCursor}`).expect(422);
      expect(wrong.body.errors).toEqual([{ field: 'cursor', code: 'invalid_format' }]);
      await get('sf-pages/products?cursor=garbage').expect(422);
      await get('sf-pages/products?limit=101').expect(422);
      await get('sf-pages/products?sort=name').expect(422);
    });

    it('категория с подкатегориями, поиск без регистра и по % как символу, фильтры свойств и цены', async () => {
      const shop = await openShop('sf-filter');
      const girls = await category(shop, 'Девочки');
      const jackets = await category(shop, 'Куртки', girls);
      const other = await category(shop, 'Прочее');
      const rost = await attribute(shop, 'Рост', ['98', '104', '110']);
      const color = await attribute(shop, 'Цвет', ['синий', 'красный']);
      const v = (r: string, c: string, price: number, stock = 1) => ({
        price,
        stock,
        values: [
          { attributeId: rost.id, value: r },
          { attributeId: color.id, value: c },
        ],
      });
      await product(shop, 'Куртка синяя', [v('98', 'синий', 10000), v('104', 'синий', 11000, 0)], {
        categoryId: jackets,
      });
      await product(shop, 'Куртка красная', [v('104', 'красный', 12000), v('110', 'красный', 13000)], {
        categoryId: jackets,
      });
      await product(shop, 'Платье 100% хлопок', [v('110', 'синий', 5000)], { categoryId: girls });
      await product(shop, 'Носки', [v('98', 'красный', 500)], { categoryId: other });

      expect(names((await list('sf-filter', `?categoryId=${girls}`)).items).sort()).toEqual([
        'Куртка красная',
        'Куртка синяя',
        'Платье 100% хлопок',
      ]);
      expect(names((await list('sf-filter', `?categoryId=${jackets}`)).items).sort()).toEqual([
        'Куртка красная',
        'Куртка синяя',
      ]);
      expect((await list('sf-filter', `?categoryId=${NO_SUCH}`)).items).toEqual([]);
      expect(names((await list('sf-filter', '?q=КУРТКА')).items).sort()).toEqual(['Куртка красная', 'Куртка синяя']);
      expect(names((await list('sf-filter', '?q=100%25')).items)).toEqual(['Платье 100% хлопок']);
      expect((await list('sf-filter', '?q=1%25')).items).toEqual([]);

      // 104 у синей куртки закончился — она не подходит
      expect(names((await list('sf-filter', `?values=${rost.value['104']}`)).items)).toEqual(['Куртка красная']);
      // внутри свойства — ИЛИ
      const or = `?values=${rost.value['98']},${rost.value['110']}&sort=price_asc`;
      expect(names((await list('sf-filter', or)).items)).toEqual([
        'Носки',
        'Платье 100% хлопок',
        'Куртка синяя',
        'Куртка красная',
      ]);
      // между свойствами — И, на одном варианте
      const and = `?values=${rost.value['98']},${color.value['синий']}`;
      expect(names((await list('sf-filter', and)).items)).toEqual(['Куртка синяя']);
      expect(names((await list('sf-filter', `?priceMin=10500&priceMax=12500`)).items)).toEqual(['Куртка красная']);
      // неизвестное значение (удалили, ссылка осталась) выборку не обнуляет
      expect((await list('sf-filter', `?values=${NO_SUCH}`)).items).toHaveLength(4);
      await get('sf-filter/products?values=not-a-uuid').expect(422);

      const facets = (await get(`sf-filter/facets?categoryId=${girls}&values=${rost.value['110']}`).expect(200)).body;
      expect(facets).toEqual({
        total: 2,
        attributes: [
          {
            id: rost.id,
            name: 'Рост',
            values: [
              { id: rost.value['98'], value: '98', count: 1 },
              { id: rost.value['104'], value: '104', count: 1 },
              { id: rost.value['110'], value: '110', count: 2 },
            ],
          },
          {
            id: color.id,
            name: 'Цвет',
            values: [
              { id: color.value['синий'], value: 'синий', count: 1 },
              { id: color.value['красный'], value: 'красный', count: 1 },
            ],
          },
        ],
        price: { min: 5000, max: 13000 },
      });
      await shop.agent.patch(`/v1/admin/attributes/${color.id}`).set(XRW).send({ inFilters: false }).expect(200);
      const noColor = (await get('sf-filter/facets?priceMax=600').expect(200)).body;
      expect(noColor.total).toBe(1);
      expect(noColor.attributes.map((a: { name: string }) => a.name)).toEqual(['Рост']);
      expect(noColor.price).toEqual({ min: 500, max: 13000 });
      expect((await get('sf-filter/facets?q=нет-такого').expect(200)).body).toEqual({
        total: 0,
        attributes: [],
        price: { min: 0, max: 0 },
      });
    });
  });

  describe('карточка товара', () => {
    it('по shortId: свойства в порядке витрины, наличие по настройке; закончившийся тоже; скрытый и чужой — 404', async () => {
      const shop = await openShop('sf-card', { lowStockThreshold: 2 });
      const other = await openShop('sf-card-other');
      const cat = await category(shop, 'Куртки');
      const color = await attribute(shop, 'Цвет', ['синий']);
      const rost = await attribute(shop, 'Рост', ['98', '104', '110']);
      const item = await product(
        shop,
        'Куртка',
        [
          { price: 11000, stock: 5, values: [{ attributeId: rost.id, value: '110' }, { attributeId: color.id, value: 'синий' }] },
          { price: 10000, stock: 2, values: [{ attributeId: rost.id, value: '98' }, { attributeId: color.id, value: 'синий' }] },
          { price: 10000, stock: 0, values: [{ attributeId: rost.id, value: '104' }, { attributeId: color.id, value: 'синий' }] },
        ],
        { categoryId: cat, description: 'Тёплая' },
      ); // prettier-ignore
      await photo(shop, item.id, 1);
      await photo(shop, item.id, 0, 'processing');

      const { body } = await get(`sf-card/products/${item.shortId}`).expect(200);
      expect(body).toMatchObject({
        id: item.id,
        shortId: item.shortId,
        slug: item.slug,
        name: 'Куртка',
        description: 'Тёплая',
        category: { id: cat, name: 'Куртки' },
        photos: [{ width: 800, height: 1000 }],
        attributes: [
          {
            id: color.id,
            name: 'Цвет',
            values: [{ id: color.value['синий'], value: 'синий' }],
          },
          {
            id: rost.id,
            name: 'Рост',
            values: [
              { id: rost.value['98'], value: '98' },
              { id: rost.value['104'], value: '104' },
              { id: rost.value['110'], value: '110' },
            ],
          },
        ],
      });
      expect(body.variants).toEqual([
        { id: item.variants[0]!.id, valueIds: [color.value['синий'], rost.value['110']], price: 11000, stock: { level: 'in', quantity: null } },
        { id: item.variants[1]!.id, valueIds: [color.value['синий'], rost.value['98']], price: 10000, stock: { level: 'low', quantity: null } },
        { id: item.variants[2]!.id, valueIds: [color.value['синий'], rost.value['104']], price: 10000, stock: { level: 'out', quantity: null } },
      ]); // prettier-ignore

      await setShop(shop, { stockDisplay: 'exact' });
      const exact = (await get(`sf-card/products/${item.shortId}`).expect(200)).body;
      expect(exact.variants.map((v: { stock: object }) => v.stock)).toEqual([
        { level: 'in', quantity: 5 },
        { level: 'low', quantity: 2 },
        { level: 'out', quantity: 0 },
      ]);

      const soldOut = await product(shop, 'Раскупленное', [{ price: 1, stock: 0 }]);
      const sold = (await get(`sf-card/products/${soldOut.shortId}`).expect(200)).body;
      expect(sold).toMatchObject({ category: null, photos: [], attributes: [], variants: [{ valueIds: [] }] });

      const hidden = await product(shop, 'Скрытое', [{ price: 1, stock: 1 }], { isVisible: false });
      await get(`sf-card/products/${hidden.shortId}`).expect(404);
      await get(`sf-card-other/products/${item.shortId}`).expect(404);
      await get('sf-card/products/zzzzz').expect(404);
      await get('sf-card/products/BAD!').expect(404);
      expect(other).toBeTruthy();
    });
  });

  describe('корзина', () => {
    it('cart/check: ok, урезано до остатка, закончился, скрытый и чужой — unavailable; итог по доступным', async () => {
      const shop = await openShop('sf-cart');
      const other = await openShop('sf-cart-other');
      const rost = await attribute(shop, 'Рост', ['110']);
      const color = await attribute(shop, 'Цвет', ['синий']);
      const item = await product(shop, 'Куртка', [
        { price: 25000, stock: 3, values: [{ attributeId: rost.id, value: '110' }, { attributeId: color.id, value: 'синий' }] },
        { price: 20000, stock: 0, values: [{ attributeId: rost.id, value: '110' }] },
      ]); // prettier-ignore
      const plain = await product(shop, 'Шапка', [{ price: 3500, stock: 10 }]);
      const hidden = await product(shop, 'Скрытая', [{ price: 1, stock: 1 }], { isVisible: false });
      const foreign = await product(other, 'Чужая', [{ price: 1, stock: 1 }]);
      await photo(shop, item.id, 0);

      const check = (items: object[]) => anon.post('/v1/storefront/sf-cart/cart/check').set(XRW).send({ items });
      const { body } = await check([
        { variantId: item.variants[0]!.id, quantity: 5 },
        { variantId: plain.variants[0]!.id, quantity: 2 },
        { variantId: item.variants[1]!.id, quantity: 1 },
        { variantId: hidden.variants[0]!.id, quantity: 1 },
        { variantId: foreign.variants[0]!.id, quantity: 1 },
        { variantId: NO_SUCH, quantity: 1 },
      ]).expect(200);
      const unavailable = (variantId: string) => ({
        variantId,
        status: 'unavailable',
        quantity: 0,
        price: null,
        product: null,
      });
      expect(body).toEqual({
        items: [
          {
            variantId: item.variants[0]!.id,
            status: 'ok',
            quantity: 3,
            price: 25000,
            product: {
              shortId: item.shortId,
              slug: item.slug,
              name: 'Куртка',
              variantLabel: 'Рост: 110, Цвет: синий',
              cover: expect.objectContaining({ width: 800 }),
            },
          },
          {
            variantId: plain.variants[0]!.id,
            status: 'ok',
            quantity: 2,
            price: 3500,
            product: { shortId: plain.shortId, slug: plain.slug, name: 'Шапка', variantLabel: '', cover: null },
          },
          {
            variantId: item.variants[1]!.id,
            status: 'out_of_stock',
            quantity: 0,
            price: 20000,
            product: expect.objectContaining({ variantLabel: 'Рост: 110' }),
          },
          unavailable(hidden.variants[0]!.id),
          unavailable(foreign.variants[0]!.id),
          unavailable(NO_SUCH),
        ],
        total: 3 * 25000 + 2 * 3500,
      });

      expect((await check([]).expect(200)).body).toEqual({ items: [], total: 0 });
      const invalid = await check([{ variantId: plain.variants[0]!.id, quantity: 0 }]).expect(422);
      expect(invalid.body.errors).toEqual([{ field: 'items.0.quantity', code: 'out_of_range', params: { min: 1 } }]);
      await anon.post('/v1/storefront/sf-cart/cart/check').send({ items: [] }).expect(403);
      await anon.post('/v1/storefront/sf-nobody/cart/check').set(XRW).send({ items: [] }).expect(404);
    });
  });
});
