import { eq } from 'drizzle-orm';
import ExcelJS from 'exceljs';
import request from 'supertest';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { signUp, XRW, type Browser } from '../../../test/helpers/session.js';
import type { Db } from '../../core/db/index.js';
import { importMappings, importRows, products as productsTable, variants } from '../../core/db/schema/index.js';
import { ProductImportService } from '../products/product-import.service.js';
import { APPLY_IMPORT, PARSE_IMPORT } from './lib/import-jobs.js';
import { readTable } from './lib/read-table.js';

const NO_SUCH = '0192d000-0000-7000-8000-00000000ffff';
const XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
const TEMPLATE = 'Артикул;Название;Цена;Остаток;Код товара;Штрихкод;Категория;Описание;Рост;Цвет';
const ONE_C = ['Код', 'Номенклатура', 'Цена розничная', 'Количество', 'Группа', 'Размер', 'Штрихкод', 'Ед. изм.'];
const ONE_C_MAPPING = [
  { column: 'Код', target: 'sku' },
  { column: 'Номенклатура', target: 'name' },
  { column: 'Цена розничная', target: 'price' },
  { column: 'Количество', target: 'stock' },
  { column: 'Группа', target: 'category' },
  { column: 'Размер', target: 'attribute', attributeName: 'Рост' },
  { column: 'Штрихкод', target: 'barcode' },
];

describe('импорт', () => {
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
  afterEach(() => {
    vi.restoreAllMocks();
    t.jobs.sent.length = 0;
  });

  type Shop = { agent: Browser; shopId: string };
  const shop = async (email: string): Promise<Shop> => {
    const { agent, me } = await signUp(t, email);
    return { agent, shopId: me.shop.id };
  };
  const csv = (...lines: string[]) => Buffer.from(`\ufeff${lines.join('\r\n')}\r\n`, 'utf8');
  const xlsx = async (rows: unknown[][]) => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Лист1');
    for (const row of rows) sheet.addRow(row);
    return Buffer.from(await workbook.xlsx.writeBuffer());
  };
  /** Загрузить файл, как админка: ссылка → файл в хранилище → `uploadId`. */
  const upload = async (s: Shop, file: Buffer, fileName = 'ostatki.csv') => {
    const contentType = fileName.endsWith('.xlsx') ? XLSX : 'text/csv';
    const res = await s.agent
      .post('/v1/admin/uploads')
      .set(XRW)
      .send({ purpose: 'import', fileName, contentType, size: file.length })
      .expect(201);
    t.storage.upload(new URL(res.body.url).pathname.replace(/^\/catalog-private\//, ''), file, contentType);
    return res.body.uploadId as string;
  };
  const start = async (s: Shop, file: Buffer, fileName?: string) => {
    const uploadId = await upload(s, file, fileName);
    return s.agent.post('/v1/admin/imports').set(XRW).send({ uploadId }).expect(202);
  };
  /** Выполнить фоновые задачи, пока они ставят новые (чтение файла само ставит проверку строк). */
  const settle = async () => {
    while (t.jobs.sent.length) await t.jobs.drain();
  };
  const get = async (s: Shop, id: string) => (await s.agent.get(`/v1/admin/imports/${id}`).expect(200)).body;
  const apply = (s: Shop, id: string, zeroMissing = true) =>
    s.agent.post(`/v1/admin/imports/${id}/apply`).set(XRW).send({ zeroMissing });
  /** Импорт от файла до «Товары загружены». */
  const run = async (s: Shop, file: Buffer, zeroMissing = true) => {
    const { body } = await start(s, file);
    await settle();
    await apply(s, body.id, zeroMissing).expect(202);
    await settle();
    return get(s, body.id);
  };
  const catalog = async (s: Shop) => {
    const { body } = await s.agent.get('/v1/admin/products').query({ sort: 'name', limit: 100 }).expect(200);
    const full = await Promise.all(
      body.items.map(async (item: { id: string }) => (await s.agent.get(`/v1/admin/products/${item.id}`)).body),
    );
    return full as {
      id: string;
      name: string;
      slug: string;
      description: string | null;
      categoryId: string | null;
      importedFields: string[];
      variants: { sku: string; barcode: string | null; price: number; stock: number; values: { attributeName: string; value: string }[] }[];
    }[]; // prettier-ignore
  };
  const stocks = async (s: Shop) =>
    Object.fromEntries((await catalog(s)).flatMap((p) => p.variants.map((v) => [v.sku, v.stock])));

  it('без сессии — 401', async () => {
    await request(t.app.getHttpServer()).get('/v1/admin/imports').expect(401);
  });

  describe('файл по шаблону', () => {
    it('читается в фоне и идёт сразу к проверке; применение создаёт товары, варианты, категории и свойства', async () => {
      const s = await shop('template@example.com');
      const created = await start(
        s,
        csv(
          TEMPLATE,
          'KD-110;Куртка демисезонная;18900;3;KD-1;4870001234110;Девочки / Куртки;Тёплая;110;розовый',
          'KD-116;Куртка демисезонная;18 900,00;1;KD-1;;Девочки / Куртки;;116;розовый',
          'TS-98;Футболка белая;4500;12;;;Базовое;Хлопок 100%;98;',
          ';Без артикула;100;1;;;;;;',
          'BAD-1;Плохая цена;12 5OO;1;;;;;;',
        ),
        'остатки 10.11.csv',
      );
      expect(created.body).toMatchObject({
        status: 'parsing',
        fileName: 'остатки 10.11.csv',
        rowCount: null,
        headers: null,
        mapping: null,
        preview: null,
        result: null,
        finishedAt: null,
      });

      await settle();
      const previewed = await get(s, created.body.id);
      expect(previewed).toMatchObject({
        status: 'previewed',
        rowCount: 5,
        headers: TEMPLATE.split(';'),
        mappingRemembered: false,
        preview: { rows: 5, create: 3, update: 0, errors: 2, missingInFile: 0 },
      });
      expect(previewed.sampleRows[0]).toMatchObject({ Артикул: 'KD-110', Цена: '18900', Рост: '110' });
      expect(previewed.mapping.slice(0, 4).map((item: { target: string }) => item.target)).toEqual([
        'sku', 'name', 'price', 'stock',
      ]); // prettier-ignore
      expect(previewed.mapping.at(-1)).toEqual({ column: 'Цвет', target: 'attribute', attributeName: 'Цвет' });
      // предпросмотр каталог не меняет
      expect(await catalog(s)).toEqual([]);

      const errors = await s.agent.get(`/v1/admin/imports/${created.body.id}/errors`).expect(200);
      expect(errors.body).toEqual({
        items: [
          { row: 5, column: 'Артикул', value: null, code: 'sku_missing' },
          { row: 6, column: 'Цена', value: '12 5OO', code: 'price_invalid' },
        ],
        nextCursor: null,
      });

      expect((await apply(s, created.body.id).expect(202)).body.status).toBe('applying');
      await settle();
      const done = await get(s, created.body.id);
      expect(done).toMatchObject({ status: 'done', result: { created: 3, updated: 0, zeroed: 0, skipped: 2 } });
      expect(Date.parse(done.finishedAt)).not.toBeNaN();

      const [jacket, shirt] = await catalog(s);
      expect(jacket).toMatchObject({
        name: 'Куртка демисезонная',
        slug: 'kurtka-demisezonnaya',
        description: 'Тёплая',
        importedFields: ['name', 'category', 'variants'],
        variants: [
          {
            sku: 'KD-110',
            barcode: '4870001234110',
            price: 18900,
            stock: 3,
            values: [
              { attributeName: 'Рост', value: '110' },
              { attributeName: 'Цвет', value: 'розовый' },
            ],
          },
          { sku: 'KD-116', barcode: null, price: 18900, stock: 1 },
        ],
      });
      expect(shirt).toMatchObject({
        name: 'Футболка белая',
        description: 'Хлопок 100%',
        variants: [{ sku: 'TS-98', price: 4500, stock: 12, values: [{ attributeName: 'Рост', value: '98' }] }],
      });
      const tree = (await s.agent.get('/v1/admin/categories').expect(200)).body;
      expect(tree.map((c: { name: string; children: { name: string }[] }) => [c.name, c.children.map((x) => x.name)])).toEqual([
        ['Девочки', ['Куртки']],
        ['Базовое', []],
      ]); // prettier-ignore
      expect(tree[0].children[0].id).toBe(jacket!.categoryId);
      const attributes = (await s.agent.get('/v1/admin/attributes').expect(200)).body;
      expect(attributes.map((a: { name: string; values: { value: string }[] }) => [a.name, a.values.map((v) => v.value)])).toEqual([
        ['Рост', ['110', '116', '98']],
        ['Цвет', ['розовый']],
      ]); // prettier-ignore
      const counts = (await s.agent.get('/v1/admin/products/counts').expect(200)).body;
      expect(counts).toMatchObject({ all: 2, outOfStock: 0 });
      // строки предпросмотра после применения не хранятся, ошибки остаются для истории
      expect(await db.select().from(importRows).where(eq(importRows.importId, created.body.id))).toEqual([]);
      expect((await s.agent.get(`/v1/admin/imports/${created.body.id}/errors`)).body.items).toHaveLength(2);
    });

    it('повторный импорт: обновляет по артикулу, новый размер идёт в свой товар, «нет в файле» обнуляется', async () => {
      const s = await shop('again@example.com');
      await run(
        s,
        csv(
          TEMPLATE,
          'KD-110;Куртка;18900;3;KD-1;;Девочки;;110;',
          'KD-116;Куртка;18900;1;KD-1;;Девочки;;116;',
          'TS-98;Футболка;4500;12;;;;;98;белый',
        ),
      );
      const second = await start(
        s,
        csv(
          TEMPLATE,
          'KD-110;Куртка зимняя;21000;0;KD-1;487;Мальчики / Верх;Новое описание;;красный',
          'KD-122;Куртка зимняя;21000;5;KD-1;;;;122;',
        ),
      );
      await settle();
      expect((await get(s, second.body.id)).preview).toEqual({
        rows: 2,
        create: 1,
        update: 1,
        errors: 0,
        missingInFile: 2,
      });
      await apply(s, second.body.id, true).expect(202);
      await settle();
      expect((await get(s, second.body.id)).result).toEqual({ created: 1, updated: 1, zeroed: 2, skipped: 0 });

      const [jacket, shirt] = await catalog(s);
      expect(jacket).toMatchObject({
        name: 'Куртка зимняя',
        slug: 'kurtka-zimnyaya',
        // описание импорт пишет только новому товару
        description: null,
        variants: [
          // пустая ячейка свойство не снимает (Рост 110), непустая — ставит (Цвет)
          {
            sku: 'KD-110',
            barcode: '487',
            price: 21000,
            stock: 0,
            values: [
              { attributeName: 'Рост', value: '110' },
              { attributeName: 'Цвет', value: 'красный' },
            ],
          },
          { sku: 'KD-116', stock: 0 },
          { sku: 'KD-122', price: 21000, stock: 5, values: [{ attributeName: 'Рост', value: '122' }] },
        ],
      });
      expect(shirt!.variants[0]).toMatchObject({ sku: 'TS-98', stock: 0, price: 4500 });
      const tree = (await s.agent.get('/v1/admin/categories').expect(200)).body;
      expect(tree.find((c: { name: string }) => c.name === 'Мальчики').children[0].id).toBe(jacket!.categoryId);
      // «цена от–до» и «всего на складе» пересчитаны: фильтр «нет в наличии» видит футболку
      const out = await s.agent.get('/v1/admin/products').query({ filter: 'out_of_stock' }).expect(200);
      expect(out.body.items.map((item: { name: string }) => item.name)).toEqual(['Футболка']);
      const list = await s.agent.get('/v1/admin/products').query({ sort: 'price_desc' }).expect(200);
      expect(list.body.items[0]).toMatchObject({ name: 'Куртка зимняя', totalStock: 5 });
    });

    it('«не обнулять»: артикулы, которых нет в файле, остаются как были', async () => {
      const s = await shop('keep@example.com');
      await run(s, csv(TEMPLATE, 'A-1;Товар А;100;5;;;;;;', 'B-1;Товар Б;100;7;;;;;;'));
      const result = await run(s, csv(TEMPLATE, 'A-1;Товар А;100;6;;;;;;'), false);
      expect(result.preview.missingInFile).toBe(1);
      expect(result.result).toEqual({ created: 0, updated: 1, zeroed: 0, skipped: 0 });
      expect(await stocks(s)).toEqual({ 'A-1': 6, 'B-1': 7 });
    });

    it('строка с ошибкой пропускается, но её артикул в файле есть — остаток не обнуляется', async () => {
      const s = await shop('error-sku@example.com');
      await run(s, csv(TEMPLATE, 'A-1;Товар А;100;5;;;;;;', 'B-1;Товар Б;100;7;;;;;;'));
      const result = await run(s, csv(TEMPLATE, 'A-1;Товар А;сто;9;;;;;;', 'B-1;Товар Б;100;8;;;;;;'));
      expect(result.preview).toMatchObject({ update: 1, errors: 1, missingInFile: 0 });
      expect(result.result).toEqual({ created: 0, updated: 1, zeroed: 0, skipped: 1 });
      expect(await stocks(s)).toEqual({ 'A-1': 5, 'B-1': 8 });
    });
  });

  describe('ручные правки', () => {
    it('название и категория, изменённые руками, теряют пометку «из Excel», и импорт их не перезаписывает', async () => {
      const s = await shop('manual-edit@example.com');
      await run(s, csv(TEMPLATE, 'A-1;Куртка дем. роз.;100;5;;;Одежда;;;', 'B-1;Платье;100;5;;;Одежда;;;'));
      const [jacket, dress] = await catalog(s);
      const other = (await s.agent.post('/v1/admin/categories').set(XRW).send({ name: 'Новинки' }).expect(201)).body;

      // то же название и та же категория — правкой не считаются
      const same = await s.agent
        .patch(`/v1/admin/products/${jacket!.id}`)
        .set(XRW)
        .send({ name: 'Куртка дем. роз.', categoryId: jacket!.categoryId, description: 'Описание' })
        .expect(200);
      expect(same.body.importedFields).toEqual(['name', 'category', 'variants']);
      const renamed = await s.agent
        .patch(`/v1/admin/products/${jacket!.id}`)
        .set(XRW)
        .send({ name: 'Куртка демисезонная розовая' })
        .expect(200);
      expect(renamed.body.importedFields).toEqual(['category', 'variants']);
      // массовая смена категории: у платья она новая, у товара уже в этой категории — ничего не меняется
      await s.agent
        .post('/v1/admin/products/bulk')
        .set(XRW)
        .send({ action: 'set_category', productIds: [dress!.id], categoryId: other.id })
        .expect(200);
      await s.agent
        .post('/v1/admin/products/bulk')
        .set(XRW)
        .send({ action: 'set_category', productIds: [jacket!.id], categoryId: jacket!.categoryId })
        .expect(200);

      await run(s, csv(TEMPLATE, 'A-1;Куртка из файла;200;1;;;Из файла;;;', 'B-1;Платье из файла;200;1;;;Из файла;;;'));
      const after = Object.fromEntries((await catalog(s)).map((product) => [product.variants[0]!.sku, product]));
      const fromFile = (await s.agent.get('/v1/admin/categories')).body.find(
        (c: { name: string }) => c.name === 'Из файла',
      ).id;
      expect(after['A-1']).toMatchObject({
        name: 'Куртка демисезонная розовая',
        categoryId: fromFile,
        description: 'Описание',
        importedFields: ['category', 'variants'],
        variants: [{ price: 200, stock: 1 }],
      });
      expect(after['B-1']).toMatchObject({
        name: 'Платье из файла',
        categoryId: other.id,
        importedFields: ['name', 'variants'],
      });
    });

    it('товар, заведённый руками: импорт обновляет цену и остаток по артикулу, но не название и не чужие остатки', async () => {
      const s = await shop('by-hand@example.com');
      const create = (name: string, sku: string) =>
        s.agent
          .post('/v1/admin/products')
          .set(XRW)
          .send({ name, variants: [{ sku, price: 1000, stock: 4, values: [] }] })
          .expect(201);
      await create('Сумка ручной работы', 'BAG-1');
      await create('Ремень', 'BELT-1');

      const first = await run(s, csv(TEMPLATE, 'BAG-1;СУМКА ЖЕН.;1500;2;;;Сумки;;;'));
      // «Ремня» в файле нет, но он заведён руками — в «нет в файле» не попадает и не обнуляется
      expect(first.preview).toMatchObject({ create: 0, update: 1, missingInFile: 0 });
      const [belt, bag] = await catalog(s);
      expect(belt).toMatchObject({ importedFields: [], variants: [{ stock: 4 }] });
      expect(bag).toMatchObject({
        name: 'Сумка ручной работы',
        categoryId: null,
        importedFields: ['variants'],
        variants: [{ sku: 'BAG-1', price: 1500, stock: 2 }],
      });

      // теперь остатки сумки ведёт Excel: в следующем файле её нет — обнуляется; ремень — по-прежнему нет
      const second = await run(s, csv(TEMPLATE, 'NEW-1;Новый товар;100;1;;;;;;'));
      expect(second.result).toEqual({ created: 1, updated: 0, zeroed: 1, skipped: 0 });
      expect(await stocks(s)).toEqual({ 'BAG-1': 0, 'BELT-1': 4, 'NEW-1': 1 });
    });
  });

  describe('выгрузка из учётной программы', () => {
    const file = () =>
      xlsx([
        ONE_C,
        ['KD-110', 'Куртка демисезонная', '18900,00', 3, 'Детская / Куртки', 110, 4870001234110, 'шт'],
        ['KD-116', 'Куртка демисезонная', '18900,00', '1,000', 'Детская / Куртки', 116, 4870001234116, 'шт'],
      ]);

    it('заголовки не как в шаблоне — шаг «Колонки» с подсказкой; выбор запоминается для такого же файла', async () => {
      const s = await shop('one-c@example.com');
      const created = await start(s, await file(), 'vygruzka_1c.xlsx');
      await settle();
      const mapping = await get(s, created.body.id);
      expect(mapping).toMatchObject({ status: 'mapping', rowCount: 2, headers: ONE_C, mappingRemembered: false, preview: null });
      expect(mapping.sampleRows[1]).toMatchObject({ Код: 'KD-116', Количество: '1,000', Штрихкод: '4870001234116' });
      expect(mapping.mapping.map((item: { target: string }) => item.target)).toEqual([
        'sku', 'name', 'price', 'stock', 'category', 'attribute', 'barcode', 'skip',
      ]); // prettier-ignore
      // пока колонки не выбраны, применять нечего
      expect((await apply(s, created.body.id).expect(409)).body.code).toBe('import_not_ready');

      const put = (body: object) => s.agent.put(`/v1/admin/imports/${created.body.id}/mapping`).set(XRW).send(body);
      const missing = await put({ mapping: ONE_C_MAPPING.filter((item) => item.target !== 'price') }).expect(422);
      expect(missing.body.errors).toEqual([{ field: 'mapping', code: 'missing_required' }]);
      const twice = await put({ mapping: [...ONE_C_MAPPING, { column: 'Ед. изм.', target: 'sku' }] }).expect(422);
      expect(twice.body.errors).toEqual([{ field: 'mapping', code: 'duplicate_target' }]);
      const foreign = await put({ mapping: [...ONE_C_MAPPING, { column: 'Нет такой', target: 'skip' }] }).expect(422);
      expect(foreign.body.errors).toEqual([{ field: 'mapping.7.column', code: 'not_found' }]);
      await put({ mapping: [{ column: 'Код', target: 'куда-то' }] }).expect(422);

      const accepted = await put({ mapping: ONE_C_MAPPING }).expect(202);
      expect(accepted.body).toMatchObject({ status: 'previewing', preview: null });
      expect(accepted.body.mapping.at(-1)).toEqual({ column: 'Ед. изм.', target: 'skip', attributeName: null });
      await settle();
      expect(await get(s, created.body.id)).toMatchObject({
        status: 'previewed',
        preview: { rows: 2, create: 2, update: 0, errors: 0, missingInFile: 0 },
      });

      // «Изменить колонки» с проверки: без штрихкода
      await put({ mapping: ONE_C_MAPPING.filter((item) => item.target !== 'barcode') }).expect(202);
      await settle();
      await apply(s, created.body.id).expect(202);
      await settle();
      const [jacket] = await catalog(s);
      expect(jacket).toMatchObject({
        name: 'Куртка демисезонная',
        variants: [
          { sku: 'KD-110', barcode: null, price: 18900, stock: 3, values: [{ attributeName: 'Рост', value: '110' }] },
          { sku: 'KD-116', barcode: null, price: 18900, stock: 1, values: [{ attributeName: 'Рост', value: '116' }] },
        ],
      });
      // после применения колонки уже не поменять
      expect((await put({ mapping: ONE_C_MAPPING }).expect(409)).body.code).toBe('import_not_ready');

      // такой же набор заголовков — без шага «Колонки», с последним выбором
      const next = await start(s, await file(), 'vygruzka_1c_2.xlsx');
      await settle();
      const remembered = await get(s, next.body.id);
      expect(remembered).toMatchObject({ status: 'previewed', mappingRemembered: true, preview: { update: 2, create: 0 } });
      expect(remembered.mapping.find((item: { column: string }) => item.column === 'Штрихкод').target).toBe('skip');
      // у другого магазина ничего не запомнено
      const other = await shop('one-c-other@example.com');
      const theirs = await start(other, await file(), 'vygruzka_1c.xlsx');
      await settle();
      expect((await get(other, theirs.body.id)).status).toBe('mapping');
      expect(await db.select().from(importMappings).where(eq(importMappings.shopId, other.shopId))).toEqual([]);
    }); // prettier-ignore
  });

  describe('файл не подошёл', () => {
    it.each([
      ['не таблица', Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0, 0, 0, 0]), 'unreadable_file'],
      ['мало колонок', Buffer.from('это не таблица\n'), 'no_required_columns'],
      ['нет строк', Buffer.from(`${TEMPLATE}\n`), 'no_rows'],
    ])('%s — failed с причиной, следующий импорт можно начинать', async (_name, file, code) => {
      const s = await shop(`bad-${code}@example.com`);
      const created = await start(s, file);
      await settle();
      const failed = await get(s, created.body.id);
      expect(failed).toMatchObject({ status: 'failed', failureCode: code, preview: null });
      expect(Date.parse(failed.finishedAt)).not.toBeNaN();
      await start(s, csv(TEMPLATE, 'A-1;Товар;100;1;;;;;;'));
    });
  });

  describe('порядок шагов', () => {
    const ONE = csv(TEMPLATE, 'A-1;Товар;100;1;;;;;;');

    it('пока импорт не закончен, второй не начать; применить и отменить можно только в своё время', async () => {
      const s = await shop('steps@example.com');
      const first = await start(s, ONE);
      const uploadId = await upload(s, ONE);
      const busy = await s.agent.post('/v1/admin/imports').set(XRW).send({ uploadId }).expect(409);
      expect(busy.body.code).toBe('import_in_progress');
      // читается — применять рано
      expect((await apply(s, first.body.id).expect(409)).body.code).toBe('import_not_ready');
      await settle();
      const noFlag = await s.agent.post(`/v1/admin/imports/${first.body.id}/apply`).set(XRW).send({}).expect(422);
      expect(noFlag.body.errors).toEqual([{ field: 'zeroMissing', code: 'required' }]);
      await apply(s, first.body.id).expect(202);
      // применяется — второй раз не применить и не отменить
      expect((await apply(s, first.body.id).expect(409)).body.code).toBe('import_not_ready');
      expect((await s.agent.delete(`/v1/admin/imports/${first.body.id}`).set(XRW).expect(409)).body.code).toBe(
        'import_not_ready',
      );
      await settle();
      expect((await s.agent.delete(`/v1/admin/imports/${first.body.id}`).set(XRW).expect(409)).body.code).toBe(
        'import_not_ready',
      );
      // закончен — загрузка, не прошедшая из-за 409, всё ещё годится
      await s.agent.post('/v1/admin/imports').set(XRW).send({ uploadId }).expect(202);
    });

    it('отмена: импорт остаётся в истории, строки удаляются, фоновая задача его уже не трогает', async () => {
      const s = await shop('cancel@example.com');
      const parsing = await start(s, ONE);
      await s.agent.delete(`/v1/admin/imports/${parsing.body.id}`).set(XRW).expect(204);
      await settle();
      expect(await get(s, parsing.body.id)).toMatchObject({ status: 'cancelled', headers: null });

      const previewed = await start(s, ONE);
      await settle();
      expect(await db.select().from(importRows).where(eq(importRows.importId, previewed.body.id))).toHaveLength(1);
      await s.agent.delete(`/v1/admin/imports/${previewed.body.id}`).set(XRW).expect(204);
      expect(await db.select().from(importRows).where(eq(importRows.importId, previewed.body.id))).toEqual([]);
      expect((await apply(s, previewed.body.id).expect(409)).body.code).toBe('import_not_ready');
      expect(await catalog(s)).toEqual([]);
      await start(s, ONE);
    });

    it('загрузка: чужая, не того назначения, уже использованная — 422 upload_not_found', async () => {
      const s = await shop('uploads@example.com');
      const other = await shop('uploads-other@example.com');
      const post = (who: Shop, uploadId: string) => who.agent.post('/v1/admin/imports').set(XRW).send({ uploadId });
      expect((await post(s, NO_SUCH).expect(422)).body.code).toBe('upload_not_found');
      expect((await post(s, await upload(other, ONE)).expect(422)).body.code).toBe('upload_not_found');
      const used = await upload(s, ONE);
      await post(s, used).expect(202);
      await settle();
      const [{ id }] = (await s.agent.get('/v1/admin/imports').expect(200)).body.items;
      await s.agent.delete(`/v1/admin/imports/${id}`).set(XRW).expect(204);
      expect((await post(s, used).expect(422)).body.code).toBe('upload_not_found');
      await post(s, 'не-uuid').expect(422);
    });

    it('чужой и несуществующий импорт — 404', async () => {
      const owner = await shop('owner@example.com');
      const other = await shop('stranger@example.com');
      const mine = await start(owner, ONE);
      await settle();
      for (const id of [mine.body.id, NO_SUCH, 'не-uuid']) {
        await other.agent.get(`/v1/admin/imports/${id}`).expect(404);
        await other.agent.get(`/v1/admin/imports/${id}/errors`).expect(404);
        await other.agent.delete(`/v1/admin/imports/${id}`).set(XRW).expect(404);
        await apply(other, id).expect(404);
        await other.agent.put(`/v1/admin/imports/${id}/mapping`).set(XRW).send({ mapping: [] }).expect(404);
      }
      expect((await other.agent.get('/v1/admin/imports').expect(200)).body.items).toEqual([]);
      expect((await get(owner, mine.body.id)).status).toBe('previewed');
    });
  });

  describe('сбои', () => {
    const ONE = csv(TEMPLATE, 'A-1;Товар;100;1;;;;;;', 'A-2;Товар 2;100;1;;;;;;');

    it('применение упало: каталог не тронут, импорт ждёт повтора; после последней попытки — failed', async () => {
      const s = await shop('crash@example.com');
      const created = await start(s, ONE);
      await settle();
      await apply(s, created.body.id).expect(202);
      t.jobs.sent.length = 0;
      const data = { shopId: s.shopId, importId: created.body.id };
      // падение в самом конце записи: товары уже вставлены в этой транзакции
      const real = t.app.get(ProductImportService);
      const original = real.apply.bind(real);
      vi.spyOn(real, 'apply').mockImplementation(async (...args) => {
        await original(...args);
        throw new Error('база отвалилась');
      });
      await expect(t.jobs.run(APPLY_IMPORT, data)).rejects.toThrow('база отвалилась');
      expect((await get(s, created.body.id)).status).toBe('applying');
      expect(await catalog(s)).toEqual([]);

      // повтор задачи проходит
      vi.restoreAllMocks();
      await t.jobs.run(APPLY_IMPORT, data);
      expect(await get(s, created.body.id)).toMatchObject({ status: 'done', result: { created: 2 } });
      expect(await catalog(s)).toHaveLength(2);
      // и ещё один повтор ничего не задваивает
      await t.jobs.run(APPLY_IMPORT, data);
      expect(await db.select().from(variants).where(eq(variants.shopId, s.shopId))).toHaveLength(2);

      const second = await start(s, csv(TEMPLATE, 'A-3;Товар 3;100;1;;;;;;'));
      await settle();
      await apply(s, second.body.id).expect(202);
      t.jobs.sent.length = 0;
      vi.spyOn(real, 'apply').mockRejectedValue(new Error('совсем сломалось'));
      const last = { shopId: s.shopId, importId: second.body.id };
      await expect(t.jobs.run(APPLY_IMPORT, last, { last: true })).rejects.toThrow();
      expect(await get(s, second.body.id)).toMatchObject({ status: 'failed', failureCode: 'internal_error' });
      expect(await db.select().from(importRows).where(eq(importRows.importId, second.body.id))).toEqual([]);
      expect(await catalog(s)).toHaveLength(2);
    });

    it('чтение упало не из-за файла: импорт ждёт повтора, на последней попытке — failed', async () => {
      const s = await shop('read-crash@example.com');
      const created = await start(s, ONE);
      t.jobs.sent.length = 0;
      const data = { shopId: s.shopId, importId: created.body.id };
      vi.spyOn(t.storage, 'get').mockRejectedValue(new Error('хранилище не отвечает'));
      await expect(t.jobs.run(PARSE_IMPORT, data)).rejects.toThrow();
      expect((await get(s, created.body.id)).status).toBe('parsing');
      await expect(t.jobs.run(PARSE_IMPORT, data, { last: true })).rejects.toThrow();
      expect(await get(s, created.body.id)).toMatchObject({ status: 'failed', failureCode: 'internal_error' });
    });

    it('артикул заняли руками между проверкой и применением — строка обновляет его, а не падает', async () => {
      const s = await shop('race@example.com');
      const created = await start(s, ONE);
      await settle();
      expect((await get(s, created.body.id)).preview).toMatchObject({ create: 2, update: 0 });
      await s.agent
        .post('/v1/admin/products')
        .set(XRW)
        .send({ name: 'Заведён руками', variants: [{ sku: 'A-1', price: 5, stock: 5, values: [] }] })
        .expect(201);
      await apply(s, created.body.id).expect(202);
      await settle();
      expect((await get(s, created.body.id)).result).toEqual({ created: 1, updated: 1, zeroed: 0, skipped: 0 });
      expect(await stocks(s)).toEqual({ 'A-1': 1, 'A-2': 1 });
    });
  });

  it('«брать из Excel»: поле снова под импортом; новое свойство с множеством значений — не в фильтрах', async () => {
    const s = await shop('take-from-excel@example.com');
    const notes = Array.from({ length: 31 }, (_, i) => `N-${i};Товар ${i};100;1;;;Одежда;;;;заметка ${i}`);
    await run(s, csv(`${TEMPLATE};Примечание`, 'A-1;Куртка;100;1;;;Одежда;;110;розовый;', ...notes));
    const attributes = (await s.agent.get('/v1/admin/attributes').expect(200)).body;
    expect(attributes.map((a: { name: string; inFilters: boolean }) => [a.name, a.inFilters])).toEqual([
      ['Рост', true],
      ['Цвет', true],
      ['Примечание', false],
    ]);

    const jacket = (await catalog(s)).find((product) => product.variants[0]!.sku === 'A-1')!;
    const patch = (body: object) => s.agent.patch(`/v1/admin/products/${jacket.id}`).set(XRW).send(body);
    expect((await patch({ name: 'Куртка демисезонная' }).expect(200)).body.importedFields).toEqual([
      'category',
      'variants',
    ]);
    await patch({ importedFields: ['variants'] }).expect(422);
    const back = await patch({ importedFields: ['name', 'category'] }).expect(200);
    expect(back.body).toMatchObject({ name: 'Куртка демисезонная', importedFields: ['name', 'category', 'variants'] });

    await run(s, csv(TEMPLATE, 'A-1;Куртка из файла;100;1;;;Одежда;;;'));
    expect((await s.agent.get(`/v1/admin/products/${jacket.id}`).expect(200)).body.name).toBe('Куртка из файла');
    // снять обе пометки разом — и импорт названия не тронет
    await patch({ importedFields: [] }).expect(200);
    await run(s, csv(TEMPLATE, 'A-1;Другое имя;100;1;;;Обувь;;;'));
    const after = (await s.agent.get(`/v1/admin/products/${jacket.id}`).expect(200)).body;
    expect(after).toMatchObject({
      name: 'Куртка из файла',
      categoryId: jacket.categoryId,
      importedFields: ['variants'],
    });
  });

  it('большой файл: 3000 строк, 1000 товаров — одной транзакцией', async () => {
    const s = await shop('big@example.com');
    const lines = Array.from({ length: 3000 }, (_, i) => {
      const product = Math.floor(i / 3);
      return `SKU-${i};Товар ${product};${1000 + product};${i % 5};G-${product};;Категория ${product % 7};;${90 + (i % 3) * 6};`;
    });
    const result = await run(s, csv(TEMPLATE, ...lines));
    expect(result).toMatchObject({ status: 'done', result: { created: 3000, updated: 0, zeroed: 0, skipped: 0 } });
    const rows = await db.select().from(productsTable).where(eq(productsTable.shopId, s.shopId));
    expect(rows).toHaveLength(1000);
    expect(new Set(rows.map((row) => row.shortId)).size).toBe(1000);
    const sample = rows.find((row) => row.name === 'Товар 7')!;
    expect(sample).toMatchObject({ minPrice: 1007, maxPrice: 1007, totalStock: 1 + 2 + 3, groupKey: 'G-7' });

    const again = await run(s, csv(TEMPLATE, ...lines.slice(0, 1500).map((line) => line.replace(/;\d+;G-/, ';9;G-'))));
    expect(again.result).toEqual({ created: 0, updated: 1500, zeroed: 1200, skipped: 0 });
  }, 120_000);

  it('история: новые сверху, по страницам; ошибки — по страницам', async () => {
    const s = await shop('history@example.com');
    const ids: string[] = [];
    for (const name of ['a.csv', 'b.csv', 'c.csv']) {
      const created = await start(s, csv(TEMPLATE, ';;;;;;;;;x', ';;;;;;;;;y', ';;;;;;;;;z'), name);
      ids.unshift(created.body.id);
      await settle();
      await s.agent.delete(`/v1/admin/imports/${created.body.id}`).set(XRW).expect(204);
    }
    const first = await s.agent.get('/v1/admin/imports').query({ limit: 2 }).expect(200);
    expect(first.body.items.map((item: { id: string }) => item.id)).toEqual(ids.slice(0, 2));
    expect(first.body.items[0]).toMatchObject({ fileName: 'c.csv', status: 'cancelled' });
    const rest = await s.agent.get('/v1/admin/imports').query({ limit: 2, cursor: first.body.nextCursor }).expect(200);
    expect(rest.body.items.map((item: { id: string }) => item.id)).toEqual(ids.slice(2));
    expect(rest.body.nextCursor).toBeNull();
    await s.agent.get('/v1/admin/imports').query({ cursor: 'мусор' }).expect(422);

    const errors = (query: object) => s.agent.get(`/v1/admin/imports/${ids[0]}/errors`).query(query).expect(200);
    const page = await errors({ limit: 2 });
    expect(page.body.items.map((item: { row: number }) => item.row)).toEqual([2, 3]);
    const tail = await errors({ limit: 2, cursor: page.body.nextCursor });
    expect(tail.body.items.map((item: { row: number }) => item.row)).toEqual([4]);
    expect(tail.body.nextCursor).toBeNull();
    await s.agent.get(`/v1/admin/imports/${ids[0]}/errors`).query({ cursor: 'мусор' }).expect(422);
  });

  it('шаблон: файл .xlsx с заголовками, который сам проходит импорт', async () => {
    const s = await shop('template-file@example.com');
    const res = await s.agent
      .get('/v1/admin/imports/template')
      .buffer(true)
      .parse((response, done) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => done(null, Buffer.concat(chunks)));
      })
      .expect(200);
    expect(res.headers['content-type']).toBe(XLSX);
    expect(res.headers['content-disposition']).toBe('attachment; filename="shablon-tovarov.xlsx"');
    const table = await readTable(res.body as Buffer);
    expect(table.headers.slice(0, 4)).toEqual(['Артикул', 'Название', 'Цена', 'Остаток']);

    const result = await run(s, res.body as Buffer);
    expect(result.result).toEqual({ created: 1, updated: 0, zeroed: 0, skipped: 0 });
    expect((await catalog(s))[0]).toMatchObject({
      name: 'Куртка демисезонная',
      variants: [{ sku: 'KD-110', stock: 3 }],
    });
  });
});
