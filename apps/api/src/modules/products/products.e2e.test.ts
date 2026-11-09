import { readFileSync } from 'node:fs';

import { eq } from 'drizzle-orm';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, TEST_PUBLIC_URL, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { signUp, XRW, type Browser } from '../../../test/helpers/session.js';
import type { Db } from '../../core/db/index.js';
import { attributes, attributeValues, categories } from '../../core/db/schema/index.js';

const JPEG = readFileSync(new URL('../../../test/fixtures/photo.jpg', import.meta.url));
const NO_SUCH = '0192d000-0000-7000-8000-00000000ffff';

describe('товары', () => {
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

  type Shop = { agent: Browser; shopId: string };
  const shop = async (email: string): Promise<Shop> => {
    const { agent, me } = await signUp(t, email);
    return { agent, shopId: me.shop.id };
  };
  const create = (s: Shop, body: object) => s.agent.post('/v1/admin/products').set(XRW).send(body);
  const simple = (s: Shop, name: string, price = 1000, stock = 1, extra: object = {}) =>
    create(s, { name, variants: [{ price, stock, values: [] }], ...extra }).expect(201);
  const list = async (s: Shop, query: Record<string, string | number> = {}) =>
    (await s.agent.get('/v1/admin/products').query(query).expect(200)).body;
  const addAttribute = async (shopId: string, name: string, values: string[]) => {
    const [attribute] = await db.insert(attributes).values({ shopId, name }).returning();
    await db
      .insert(attributeValues)
      .values(values.map((value, position) => ({ shopId, attributeId: attribute!.id, value, position })));
    return attribute!.id;
  };
  const addCategory = async (shopId: string, name: string) => {
    const [category] = await db.insert(categories).values({ shopId, name, path: name }).returning();
    return category!.id;
  };
  /** Загрузить фото, как админка: ссылка → файл в хранилище → `uploadId`. */
  const upload = async (s: Shop, purpose = 'product_photo') => {
    const res = await s.agent
      .post('/v1/admin/uploads')
      .set(XRW)
      .send({ purpose, fileName: 'photo.jpg', contentType: 'image/jpeg', size: JPEG.length })
      .expect(201);
    t.storage.upload(new URL(res.body.url).pathname.replace(/^\/catalog-private\//, ''), JPEG);
    return res.body.uploadId as string;
  };

  it('без сессии — 401', async () => {
    await request(t.app.getHttpServer()).get('/v1/admin/products').expect(401);
  });

  describe('создание', () => {
    it('товар без размеров: артикул придуман из кода товара, адрес из названия', async () => {
      const s = await shop('create@example.com');
      const { body } = await create(s, {
        name: '  Куртка демисезонная ',
        description: '   ',
        variants: [{ price: 12900, stock: 3, values: [] }],
      }).expect(201);
      expect(body).toMatchObject({
        name: 'Куртка демисезонная',
        slug: 'kurtka-demisezonnaya',
        description: null,
        categoryId: null,
        isVisible: true,
        importedFields: [],
        photos: [],
        variants: [{ sku: `${body.shortId.toUpperCase()}-1`, barcode: null, price: 12900, stock: 3, values: [] }],
      });
      expect(body.shortId).toMatch(/^[0-9a-z]{5}$/);
      expect((await s.agent.get(`/v1/admin/products/${body.id}`).expect(200)).body).toEqual(body);
    });

    it('с размерами: значение по тексту, «Свой размер» добавляется в свойство', async () => {
      const s = await shop('sizes@example.com');
      const rost = await addAttribute(s.shopId, 'Рост', ['92', '98']);
      const { body } = await create(s, {
        name: 'Платье',
        isVisible: false,
        variants: [
          { sku: 'PL-98', barcode: '4870001', price: 5000, stock: 2, values: [{ attributeId: rost, value: '98' }] },
          { price: 5500, stock: 0, values: [{ attributeId: rost, value: ' 104 ' }] },
        ],
      }).expect(201);
      expect(body.isVisible).toBe(false);
      expect(body.variants).toMatchObject([
        { sku: 'PL-98', barcode: '4870001', values: [{ attributeId: rost, attributeName: 'Рост', value: '98' }] },
        { sku: `${body.shortId.toUpperCase()}-1`, values: [{ attributeName: 'Рост', value: '104' }] },
      ]);
      const values = await db.select().from(attributeValues).where(eq(attributeValues.attributeId, rost));
      expect(values.map((value) => [value.value, value.position]).sort()).toEqual([
        ['104', 2],
        ['92', 0],
        ['98', 1],
      ]);
    });

    it('ошибки по ячейкам: пустое название, повтор размера, чужое свойство, чужая категория', async () => {
      const s = await shop('invalid@example.com');
      const other = await shop('invalid-other@example.com');
      const rost = await addAttribute(s.shopId, 'Рост', ['98']);
      const foreignAttribute = await addAttribute(other.shopId, 'Рост', ['98']);
      const foreignCategory = await addCategory(other.shopId, 'Куртки');
      const v = (values: object[]) => ({ price: 1, stock: 1, values });

      const errorsOf = async (body: object) => (await create(s, body).expect(422)).body.errors;
      expect(await errorsOf({ name: '   ', variants: [v([])] })).toEqual([{ field: 'name', code: 'required' }]);
      expect(
        await errorsOf({
          name: 'Платье',
          variants: [v([{ attributeId: rost, value: '98' }]), v([{ attributeId: rost, value: '98' }])],
        }),
      ).toEqual([{ field: 'variants.1.values', code: 'duplicate' }]);
      expect(
        await errorsOf({ name: 'Платье', variants: [v([{ attributeId: foreignAttribute, value: '98' }])] }),
      ).toEqual([{ field: 'variants.0.values.0.attributeId', code: 'not_found' }]);
      expect(await errorsOf({ name: 'Платье', categoryId: foreignCategory, variants: [v([])] })).toEqual([
        { field: 'categoryId', code: 'not_found' },
      ]);
      expect((await list(s)).total).toBe(0);
    });

    it('артикул другого товара — 409 sku_taken; в другом магазине — можно', async () => {
      const s = await shop('sku@example.com');
      await create(s, { name: 'А', variants: [{ sku: 'ABC-1', price: 1, stock: 1, values: [] }] }).expect(201);
      const res = await create(s, { name: 'Б', variants: [{ sku: 'ABC-1', price: 1, stock: 1, values: [] }] });
      expect(res.status).toBe(409);
      expect(res.body.code).toBe('sku_taken');
      const other = await shop('sku-other@example.com');
      await create(other, { name: 'Б', variants: [{ sku: 'ABC-1', price: 1, stock: 1, values: [] }] }).expect(201);
    });

    it('с фото из загрузок: в этом порядке, сжатие поставлено; не та загрузка — товара нет', async () => {
      const s = await shop('create-photos@example.com');
      const first = await upload(s);
      const second = await upload(s);
      t.jobs.sent.length = 0;
      const { body } = await simple(s, 'С фото', 1000, 1, { photoUploadIds: [first, second] });
      expect(body.photos).toMatchObject([
        { position: 0, status: 'processing', image: null },
        { position: 1, status: 'processing', image: null },
      ]);
      expect(t.jobs.sent.map((job) => job.name)).toEqual(['photos.process', 'photos.process']);

      const logo = await upload(s, 'logo');
      const failed = await create(s, {
        name: 'Не тот файл',
        variants: [{ price: 1, stock: 1, values: [] }],
        photoUploadIds: [logo],
      });
      expect(failed.status).toBe(422);
      expect(failed.body.code).toBe('upload_not_found');
      expect((await list(s)).total).toBe(1);
    });
  });

  describe('таблица размеров (PUT)', () => {
    it('обновить по id, добавить, удалить; цена от–до и остаток пересчитаны', async () => {
      const s = await shop('variants@example.com');
      const rost = await addAttribute(s.shopId, 'Рост', ['92', '98', '104']);
      const { body: product } = await create(s, {
        name: 'Комбинезон',
        variants: [
          { sku: 'K-92', price: 9000, stock: 1, values: [{ attributeId: rost, value: '92' }] },
          { sku: 'K-98', price: 9000, stock: 2, values: [{ attributeId: rost, value: '98' }] },
        ],
      }).expect(201);
      const [v92, v98] = product.variants;

      const { body } = await s.agent
        .put(`/v1/admin/products/${product.id}/variants`)
        .set(XRW)
        .send({
          variants: [
            { id: v98.id, sku: 'K-98', price: 9500, stock: 0, values: [{ attributeId: rost, value: '98' }] },
            { price: 11000, stock: 4, values: [{ attributeId: rost, value: '104' }] },
          ],
        })
        .expect(200);
      expect(body.variants).toMatchObject([
        { id: v98.id, sku: 'K-98', price: 9500, stock: 0 },
        { sku: `${product.shortId.toUpperCase()}-1`, price: 11000, stock: 4, values: [{ value: '104' }] },
      ]);
      expect(body.variants.map((variant: { id: string }) => variant.id)).not.toContain(v92.id);
      expect((await list(s)).items[0]).toMatchObject({
        price: 9500,
        priceVaries: true,
        totalStock: 4,
        variantCount: 2,
      });
    });

    it('обмен артикулами между строками; стёртый артикул остаётся прежним', async () => {
      const s = await shop('swap@example.com');
      const { body: product } = await create(s, {
        name: 'Носки',
        variants: [
          { sku: 'A', price: 1, stock: 1, values: [] },
        ],
      }).expect(201);
      const rost = await addAttribute(s.shopId, 'Размер', ['S', 'M']);
      const put = (variants: object[]) =>
        s.agent.put(`/v1/admin/products/${product.id}/variants`).set(XRW).send({ variants });
      const two = (await put([
        { id: product.variants[0].id, sku: 'A', price: 1, stock: 1, values: [{ attributeId: rost, value: 'S' }] },
        { sku: 'B', price: 1, stock: 1, values: [{ attributeId: rost, value: 'M' }] },
      ]).expect(200)).body.variants;
      const swapped = (await put([
        { id: two[0].id, sku: 'B', price: 1, stock: 1, values: [{ attributeId: rost, value: 'S' }] },
        { id: two[1].id, sku: null, price: 1, stock: 1, values: [{ attributeId: rost, value: 'M' }] },
      ]).expect(409)).body;
      // вторая строка сохранила бы «B» — повтор с первой: 409, ничего не изменилось
      expect(swapped.code).toBe('sku_taken');
      const ok = (await put([
        { id: two[0].id, sku: 'B', price: 1, stock: 1, values: [{ attributeId: rost, value: 'S' }] },
        { id: two[1].id, sku: 'A', price: 1, stock: 1, values: [{ attributeId: rost, value: 'M' }] },
      ]).expect(200)).body.variants;
      expect(ok.map((variant: { sku: string }) => variant.sku)).toEqual(['B', 'A']);
      const kept = (await put([
        { id: ok[0].id, sku: '', price: 2, stock: 1, values: [{ attributeId: rost, value: 'S' }] },
      ]).expect(200)).body.variants;
      expect(kept[0]).toMatchObject({ sku: 'B', price: 2 });
    }); // prettier-ignore

    it('id варианта другого товара — 422; чужой товар — 404', async () => {
      const s = await shop('variants-foreign@example.com');
      const a = (await simple(s, 'А')).body;
      const b = (await simple(s, 'Б')).body;
      const res = await s.agent
        .put(`/v1/admin/products/${a.id}/variants`)
        .set(XRW)
        .send({ variants: [{ id: b.variants[0].id, price: 1, stock: 1, values: [] }] })
        .expect(422);
      expect(res.body.errors).toEqual([{ field: 'variants.0.id', code: 'not_found' }]);
      const other = await shop('variants-other@example.com');
      await other.agent
        .put(`/v1/admin/products/${a.id}/variants`)
        .set(XRW)
        .send({ variants: [{ price: 1, stock: 1, values: [] }] })
        .expect(404);
    });
  });

  describe('изменение и удаление', () => {
    it('только переданные поля; новое название — новый slug, код товара прежний', async () => {
      const s = await shop('update@example.com');
      const category = await addCategory(s.shopId, 'Куртки');
      const { body: product } = await simple(s, 'Куртка', 1000, 1, { description: 'Тёплая', categoryId: category });
      const { body } = await s.agent
        .patch(`/v1/admin/products/${product.id}`)
        .set(XRW)
        .send({ name: 'Парка', description: '', isVisible: false })
        .expect(200);
      expect(body).toMatchObject({
        name: 'Парка',
        slug: 'parka',
        shortId: product.shortId,
        description: null,
        isVisible: false,
        categoryId: category,
      });
      const cleared = await s.agent.patch(`/v1/admin/products/${product.id}`).set(XRW).send({ categoryId: null });
      expect(cleared.body.categoryId).toBeNull();
    });

    it('пустое название, чужая категория, неверный тип — 422 по полю, товар прежний', async () => {
      const s = await shop('update-invalid@example.com');
      const other = await shop('update-invalid-other@example.com');
      const foreign = await addCategory(other.shopId, 'Чужая');
      const { body: product } = await simple(s, 'Куртка');
      const patch = (body: object) => s.agent.patch(`/v1/admin/products/${product.id}`).set(XRW).send(body);
      expect((await patch({ name: '   ' }).expect(422)).body.errors).toEqual([{ field: 'name', code: 'required' }]);
      expect((await patch({ categoryId: foreign }).expect(422)).body.errors).toEqual([
        { field: 'categoryId', code: 'not_found' },
      ]);
      expect((await patch({ isVisible: 'да' }).expect(422)).body.errors).toMatchObject([{ field: 'isVisible' }]);
      expect((await s.agent.get(`/v1/admin/products/${product.id}`).expect(200)).body).toEqual(product);
    });

    it('несуществующий, чужой или не UUID — 404', async () => {
      const s = await shop('missing@example.com');
      const other = await shop('missing-other@example.com');
      const { body: product } = await simple(other, 'Чужой');
      await s.agent.get(`/v1/admin/products/${NO_SUCH}`).expect(404);
      await s.agent.get(`/v1/admin/products/${product.id}`).expect(404);
      await s.agent.get('/v1/admin/products/not-a-uuid').expect(404);
      await s.agent.patch(`/v1/admin/products/${product.id}`).set(XRW).send({ name: 'Моё' }).expect(404);
      await s.agent.delete(`/v1/admin/products/${product.id}`).set(XRW).expect(404);
      await other.agent.get(`/v1/admin/products/${product.id}`).expect(200);
    });

    it('удаление: товар, варианты и файлы фото', async () => {
      const s = await shop('delete@example.com');
      const { body: product } = await simple(s, 'Удалить', 1000, 1, { photoUploadIds: [await upload(s)] });
      await t.jobs.drain();
      expect(t.storage.keys('public', `shops/${s.shopId}/photos/`)).toHaveLength(3);
      await s.agent.delete(`/v1/admin/products/${product.id}`).set(XRW).expect(204);
      await s.agent.get(`/v1/admin/products/${product.id}`).expect(404);
      expect(t.storage.keys('public', `shops/${s.shopId}/`)).toEqual([]);
      expect(t.storage.keys('private', `uploads/${s.shopId}/`)).toEqual([]);
    });
  });

  describe('список', () => {
    let s: Shop;
    let category: string;

    beforeAll(async () => {
      s = await shop('list@example.com');
      category = await addCategory(s.shopId, 'Платья');
      await simple(s, 'Шапка', 3000, 0);
      await simple(s, 'Платье 100% хлопок', 8000, 5, { categoryId: category });
      await simple(s, 'Арбуз-рюкзак', 5000, 2, { isVisible: false });
      await create(s, { name: 'Ботинки', variants: [{ sku: 'BOOT-77', barcode: '4870123', price: 15000, stock: 1, values: [] }] }).expect(201); // prettier-ignore
      await simple(s, 'Варежки', 3000, 9, { photoUploadIds: [await upload(s)] });
    });

    const names = (body: { items: { name: string }[] }) => body.items.map((item) => item.name);

    it('по умолчанию — сначала новые; строка списка', async () => {
      const body = await list(s);
      expect(body.total).toBe(5);
      expect(names(body)).toEqual(['Варежки', 'Ботинки', 'Арбуз-рюкзак', 'Платье 100% хлопок', 'Шапка']);
      expect(body.items.find((item: { name: string }) => item.name === 'Платье 100% хлопок')).toMatchObject({
        category: { id: category, name: 'Платья' },
        price: 8000,
        priceVaries: false,
        totalStock: 5,
        variantCount: 1,
        isVisible: true,
        cover: null,
        photoCount: 0,
      });
    });

    it('порядки: название, цена, остаток (равные — по id, стабильно)', async () => {
      expect(names(await list(s, { sort: 'name' }))).toEqual(['Арбуз-рюкзак', 'Ботинки', 'Варежки', 'Платье 100% хлопок', 'Шапка']);
      expect((await list(s, { sort: 'price_asc' })).items.map((item: { price: number }) => item.price)).toEqual([3000, 3000, 5000, 8000, 15000]);
      expect(names(await list(s, { sort: 'price_desc' }))[0]).toBe('Ботинки');
      expect((await list(s, { sort: 'stock_asc' })).items.map((item: { totalStock: number }) => item.totalStock)).toEqual([0, 1, 2, 5, 9]);
    }); // prettier-ignore

    it('страницы по курсору: все строки по одному разу при любом порядке', async () => {
      for (const sort of ['new', 'name', 'price_asc', 'price_desc', 'stock_asc']) {
        const seen: string[] = [];
        let cursor: string | null = null;
        do {
          const page: { items: { name: string }[]; nextCursor: string | null; total: number } = await list(s, {
            sort,
            limit: 2,
            ...(cursor ? { cursor } : {}),
          });
          expect(page.total).toBe(5);
          seen.push(...names(page));
          cursor = page.nextCursor;
        } while (cursor);
        expect(seen).toEqual(names(await list(s, { sort })));
      }
    });

    it('курсор от другого порядка или испорченный — 422', async () => {
      const { nextCursor } = await list(s, { limit: 1 });
      const res = await s.agent.get('/v1/admin/products').query({ sort: 'name', cursor: nextCursor }).expect(422);
      expect(res.body.errors).toEqual([{ field: 'cursor', code: 'invalid_format' }]);
      await s.agent.get('/v1/admin/products').query({ cursor: 'garbage' }).expect(422);
    });

    it('поиск по названию, артикулу, штрихкоду, без учёта регистра; % — обычный символ', async () => {
      expect(names(await list(s, { q: 'ПЛАТЬЕ' }))).toEqual(['Платье 100% хлопок']);
      expect(names(await list(s, { q: 'boot-7' }))).toEqual(['Ботинки']);
      expect(names(await list(s, { q: '4870123' }))).toEqual(['Ботинки']);
      expect(names(await list(s, { q: '0%' }))).toEqual(['Платье 100% хлопок']);
      expect((await list(s, { q: '%' })).total).toBe(1);
    });

    it('вкладки и категория; счётчики', async () => {
      expect(names(await list(s, { filter: 'hidden' }))).toEqual(['Арбуз-рюкзак']);
      expect(names(await list(s, { filter: 'out_of_stock' }))).toEqual(['Шапка']);
      expect((await list(s, { filter: 'no_photo' })).total).toBe(4);
      expect(names(await list(s, { categoryId: category }))).toEqual(['Платье 100% хлопок']);
      expect((await s.agent.get('/v1/admin/products/counts').expect(200)).body).toEqual({
        all: 5,
        noPhoto: 4,
        outOfStock: 1,
        hidden: 1,
      });
    });

    it('обложка — первое фото, когда сжато', async () => {
      const before = (await list(s, { q: 'Варежки' })).items[0];
      expect(before).toMatchObject({ photoCount: 1, cover: null });
      await t.jobs.drain();
      const after = (await list(s, { q: 'Варежки' })).items[0];
      expect(after.cover).toMatchObject({ width: 400, height: 300 });
      expect(after.cover.sizes['320']).toMatch(
        new RegExp(`^${TEST_PUBLIC_URL}/shops/${s.shopId}/photos/.+/320\\.webp$`),
      );
    });
  });

  describe('массовые действия', () => {
    it('скрыть и показать; чужие id пропускаются', async () => {
      const s = await shop('bulk@example.com');
      const other = await shop('bulk-other@example.com');
      const a = (await simple(s, 'А')).body;
      const b = (await simple(s, 'Б')).body;
      const foreign = (await simple(other, 'Чужой')).body;
      const bulk = (body: object) => s.agent.post('/v1/admin/products/bulk').set(XRW).send(body);
      expect((await bulk({ productIds: [a.id, b.id, foreign.id], action: 'hide' }).expect(200)).body).toEqual({ updated: 2 });
      expect((await list(s, { filter: 'hidden' })).total).toBe(2);
      expect((await other.agent.get(`/v1/admin/products/${foreign.id}`)).body.isVisible).toBe(true);
      expect((await bulk({ productIds: [a.id], action: 'show' })).body).toEqual({ updated: 1 });
    }); // prettier-ignore

    it('сменить категорию: без categoryId — 422, чужая — 422, null — без категории', async () => {
      const s = await shop('bulk-category@example.com');
      const category = await addCategory(s.shopId, 'Шапки');
      const foreignCategory = await addCategory((await shop('bulk-category-other@example.com')).shopId, 'Шапки');
      const a = (await simple(s, 'А')).body;
      const bulk = (body: object) => s.agent.post('/v1/admin/products/bulk').set(XRW).send(body);
      expect((await bulk({ productIds: [a.id], action: 'set_category' }).expect(422)).body.errors).toEqual([
        { field: 'categoryId', code: 'required' },
      ]);
      await bulk({ productIds: [a.id], action: 'set_category', categoryId: foreignCategory }).expect(422);
      await bulk({ productIds: [a.id], action: 'set_category', categoryId: category }).expect(200);
      expect((await s.agent.get(`/v1/admin/products/${a.id}`)).body.categoryId).toBe(category);
      await bulk({ productIds: [a.id], action: 'set_category', categoryId: null }).expect(200);
      expect((await s.agent.get(`/v1/admin/products/${a.id}`)).body.categoryId).toBeNull();
    });
  });

  describe('фото', () => {
    it('добавить в конец → сжать → готово с адресами; больше 10 — 409', async () => {
      const s = await shop('photos@example.com');
      const { body: product } = await simple(s, 'Фото');
      // загрузку — заранее: запрос supertest нельзя создавать до другого запроса (pitfalls.md)
      const add = async () => {
        const uploadId = await upload(s);
        return s.agent.post(`/v1/admin/products/${product.id}/photos`).set(XRW).send({ uploadId });
      };
      const photo = (await add()).body;
      expect(photo).toMatchObject({ position: 0, status: 'processing', image: null });
      await t.jobs.drain();
      const ready = (await s.agent.get(`/v1/admin/products/${product.id}`)).body.photos[0];
      expect(ready).toMatchObject({ id: photo.id, status: 'ready', image: { width: 400, height: 300 } });

      for (let i = 1; i < 10; i++) expect((await add()).status).toBe(201);
      const extra = await add();
      expect(extra.status).toBe(409);
      expect(extra.body.code).toBe('photo_limit_reached');
    });

    it('порядок: ровно все фото, иначе 422; удаление сдвигает остальные и стирает файлы', async () => {
      const s = await shop('photos-order@example.com');
      const { body: product } = await simple(s, 'Фото', 1000, 1, {
        photoUploadIds: [await upload(s), await upload(s), await upload(s)],
      });
      await t.jobs.drain();
      const [p0, p1, p2] = product.photos.map((photo: { id: string }) => photo.id);
      const order = (photoIds: string[]) =>
        s.agent.put(`/v1/admin/products/${product.id}/photos/order`).set(XRW).send({ photoIds });

      const reordered = (await order([p2, p0, p1]).expect(200)).body;
      expect(reordered.map((photo: { id: string; position: number }) => [photo.id, photo.position])).toEqual([
        [p2, 0],
        [p0, 1],
        [p1, 2],
      ]);
      expect((await order([p2, p0]).expect(422)).body.errors).toEqual([{ field: 'photoIds', code: 'invalid_value' }]);
      await order([p2, p0, p0]).expect(422);

      await s.agent.delete(`/v1/admin/products/${product.id}/photos/${p2}`).set(XRW).expect(204);
      const rest = (await s.agent.get(`/v1/admin/products/${product.id}`)).body.photos;
      expect(rest.map((photo: { id: string; position: number }) => [photo.id, photo.position])).toEqual([
        [p0, 0],
        [p1, 1],
      ]);
      expect(t.storage.keys('public', `shops/${s.shopId}/photos/${p2}/`)).toEqual([]);
      await s.agent.delete(`/v1/admin/products/${product.id}/photos/${p2}`).set(XRW).expect(404);
    });

    it('загрузка чужая или для логотипа — 422 upload_not_found; чужой товар — 404', async () => {
      const s = await shop('photos-foreign@example.com');
      const other = await shop('photos-foreign-other@example.com');
      const { body: product } = await simple(s, 'Фото');
      const add = async (agent: Browser, productId: string, uploadId: Promise<string>) => {
        const id = await uploadId;
        return agent.post(`/v1/admin/products/${productId}/photos`).set(XRW).send({ uploadId: id });
      };
      expect((await add(s.agent, product.id, upload(other))).body.code).toBe('upload_not_found');
      expect((await add(s.agent, product.id, upload(s, 'logo'))).body.code).toBe('upload_not_found');
      expect((await add(other.agent, product.id, upload(other))).status).toBe(404);
    });
  });

  it('чек-лист магазина считает товары модуля товаров', async () => {
    const s = await shop('readiness@example.com');
    await simple(s, 'Видимый');
    await simple(s, 'Скрытый', 1000, 1, { isVisible: false });
    const { body } = await s.agent.get('/v1/admin/shop').expect(200);
    expect(body.readiness).toMatchObject({ productCount: 2, productsWithoutPhoto: 2 });
  });
});
