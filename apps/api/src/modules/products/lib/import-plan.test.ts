import { describe, expect, it } from 'vitest';

import { buildPlan, type ImportRow, type ShopIndex } from './import-plan.js';

const row = (number: number, sku: string, name: string, extra: Partial<ImportRow> = {}): ImportRow => ({
  number,
  sku,
  name,
  price: 1000,
  stock: 1,
  groupKey: null,
  barcode: null,
  category: null,
  description: null,
  attributes: [],
  ...extra,
});
const EMPTY: ShopIndex = { products: [], variants: [] };
const variant = (id: string, sku: string, productId: string, stock = 1, position = 0) => ({
  id,
  sku,
  productId,
  stock,
  position,
});

describe('план импорта', () => {
  it('пустой магазин: строки с одним «Кодом товара» — один товар, без кода — по названию', () => {
    const plan = buildPlan(
      [
        row(2, 'KD-110', 'Куртка', { groupKey: 'KD', category: ['Девочки'] }),
        row(3, 'KD-116', 'Куртка 116', { groupKey: 'KD', description: 'Тёплая' }),
        row(4, 'TS-1', 'Футболка  белая'),
        row(5, 'TS-2', 'футболка белая'),
        row(6, 'PL-1', 'Платье'),
      ],
      EMPTY,
    );
    expect(plan.newProducts.map((product) => [product.groupKey, product.name, product.variants.map((v) => v.sku)])).toEqual([
      ['KD', 'Куртка', ['KD-110', 'KD-116']],
      ['футболка белая', 'Футболка  белая', ['TS-1', 'TS-2']],
      ['платье', 'Платье', ['PL-1']],
    ]); // prettier-ignore
    // описание и категория — из первой строки группы, где они есть
    expect(plan.newProducts[0]).toMatchObject({ description: 'Тёплая', category: ['Девочки'] });
    expect(plan.actions).toEqual([2, 3, 4, 5, 6].map((n) => ({ row: n, action: 'create', variantId: null })));
    expect(plan.updatedVariants).toEqual([]);
    expect(plan.missing).toEqual([]);
  });

  it('артикул есть — обновление; новый артикул группы — в тот же товар, после последнего варианта', () => {
    const index: ShopIndex = {
      products: [{ id: 'p1', groupKey: 'KD', importedFields: ['name', 'category', 'variants'] }],
      variants: [variant('v1', 'KD-110', 'p1', 3, 0), variant('v2', 'KD-116', 'p1', 0, 1)],
    };
    const plan = buildPlan(
      [
        row(2, 'KD-122', 'Куртка новая', { groupKey: 'KD' }),
        row(3, 'KD-110', 'Куртка старая', { groupKey: 'KD', price: 500, category: ['Мальчики'] }),
      ],
      index,
    );
    expect(plan.newProducts).toEqual([]);
    expect(plan.updatedVariants).toMatchObject([{ variantId: 'v1', productId: 'p1', sku: 'KD-110', price: 500 }]);
    expect(plan.addedVariants).toMatchObject([{ productId: 'p1', firstPosition: 2, variants: [{ sku: 'KD-122' }] }]);
    expect(plan.actions).toEqual([
      { row: 2, action: 'create', variantId: null },
      { row: 3, action: 'update', variantId: 'v1' },
    ]);
    // название — из первой строки товара в файле, категория — из первой, где она есть
    expect(plan.productPatches).toEqual([
      { productId: 'p1', name: 'Куртка новая', category: ['Мальчики'], groupKey: null },
    ]);
    expect(plan.touchedProductIds).toEqual(['p1']);
  });

  it('поле без пометки «из Excel» импорт не трогает', () => {
    const index: ShopIndex = {
      products: [
        { id: 'p1', groupKey: 'a', importedFields: ['variants'] },
        { id: 'p2', groupKey: 'b', importedFields: ['category', 'variants'] },
      ],
      variants: [variant('v1', 'A-1', 'p1'), variant('v2', 'B-1', 'p2')],
    };
    const plan = buildPlan(
      [
        row(2, 'A-1', 'Новое имя', { groupKey: 'a', category: ['Новая'] }),
        row(3, 'B-1', 'Новое имя', { groupKey: 'b', category: ['Новая'] }),
      ],
      index,
    );
    expect(plan.productPatches).toEqual([{ productId: 'p2', name: null, category: ['Новая'], groupKey: null }]);
    expect(plan.touchedProductIds).toEqual(['p1', 'p2']);
  });

  it('товар заведён руками: новый артикул той же группы файла идёт к нему, товар получает ключ группы', () => {
    const index: ShopIndex = {
      products: [{ id: 'manual', groupKey: null, importedFields: [] }],
      variants: [variant('v1', 'KD-110', 'manual', 2, 0)],
    };
    const plan = buildPlan(
      [
        // новая строка раньше той, по которой находится товар
        row(2, 'KD-116', 'Куртка', { groupKey: 'KD' }),
        row(3, 'KD-110', 'Куртка', { groupKey: 'KD' }),
      ],
      index,
    );
    expect(plan.newProducts).toEqual([]);
    expect(plan.addedVariants).toMatchObject([{ productId: 'manual', firstPosition: 1 }]);
    expect(plan.productPatches).toEqual([{ productId: 'manual', name: null, category: null, groupKey: 'KD' }]);
  });

  it('товар с ключом группы важнее товара, найденного по соседнему артикулу; вариант не переезжает', () => {
    const index: ShopIndex = {
      products: [
        { id: 'old', groupKey: null, importedFields: [] },
        { id: 'keyed', groupKey: 'KD', importedFields: ['variants'] },
      ],
      variants: [variant('v1', 'KD-110', 'old')],
    };
    const plan = buildPlan(
      [row(2, 'KD-110', 'Куртка', { groupKey: 'KD' }), row(3, 'KD-116', 'Куртка', { groupKey: 'KD' })],
      index,
    );
    expect(plan.updatedVariants).toMatchObject([{ variantId: 'v1', productId: 'old' }]);
    expect(plan.addedVariants).toMatchObject([{ productId: 'keyed', firstPosition: 0 }]);
    expect(plan.productPatches).toEqual([]);
  });

  it('«нет в файле»: только варианты «из Excel» с остатком; артикул строки с ошибкой — в файле', () => {
    const index: ShopIndex = {
      products: [
        { id: 'excel', groupKey: 'e', importedFields: ['name', 'variants'] },
        { id: 'manual', groupKey: null, importedFields: [] },
      ],
      variants: [
        variant('in-file', 'E-1', 'excel', 5),
        variant('missing', 'E-2', 'excel', 5),
        variant('already-zero', 'E-3', 'excel', 0),
        variant('error-row', 'E-4', 'excel', 5),
        variant('by-hand', 'M-1', 'manual', 5),
      ],
    };
    const plan = buildPlan([row(2, 'E-1', 'Товар', { groupKey: 'e' })], index, ['E-4']);
    expect(plan.missing).toEqual([{ variantId: 'missing', productId: 'excel' }]);
  });
});
