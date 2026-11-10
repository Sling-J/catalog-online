import { describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor } from '../../../core/pagination/index.js';
import { storefrontCategoryTree } from './categories.js';
import { computeFacets, groupValues, hasVariantFilter, type FacetAttribute, type FacetVariant } from './facets.js';
import { stockLevel, toStockInfo, variantLabel } from './stock.js';

describe('наличие', () => {
  it('нет / мало (не больше порога) / есть; число — только в режиме exact', () => {
    expect([0, 1, 2, 3].map((stock) => stockLevel(stock, 2))).toEqual(['out', 'low', 'low', 'in']);
    expect(toStockInfo(2, { stockDisplay: 'levels', lowStockThreshold: 2 })).toEqual({ level: 'low', quantity: null });
    expect(toStockInfo(7, { stockDisplay: 'exact', lowStockThreshold: 2 })).toEqual({ level: 'in', quantity: 7 });
    expect(toStockInfo(0, { stockDisplay: 'exact', lowStockThreshold: 2 })).toEqual({ level: 'out', quantity: 0 });
  });

  it('подпись варианта — как у витрины', () => {
    expect(
      variantLabel([
        { attributeName: 'Рост', value: '110' },
        { attributeName: 'Цвет', value: 'синий' },
      ]),
    ).toBe('Рост: 110, Цвет: синий');
    expect(variantLabel([])).toBe('');
  });
});

describe('дерево категорий витрины', () => {
  const row = (id: string, parentId: string | null, position: number, productCount: number) => ({
    id,
    name: id,
    parentId,
    position,
    productCount,
  });

  it('у родителя — с подкатегориями, пустые скрыты, порядок по position', () => {
    expect(
      storefrontCategoryTree([
        row('b', null, 1, 0),
        row('a', null, 0, 1),
        row('a2', 'a', 1, 2),
        row('a1', 'a', 0, 0),
        row('b1', 'b', 0, 3),
        row('c', null, 2, 0),
      ]),
    ).toEqual([
      { id: 'a', name: 'a', productCount: 3, children: [{ id: 'a2', name: 'a2', productCount: 2, children: [] }] },
      { id: 'b', name: 'b', productCount: 3, children: [{ id: 'b1', name: 'b1', productCount: 3, children: [] }] },
    ]);
  });
});

describe('фасеты', () => {
  const attributes: FacetAttribute[] = [
    { id: 'rost', name: 'Рост', inFilters: true, values: [{ id: 'r98', value: '98' }, { id: 'r104', value: '104' }] },
    { id: 'color', name: 'Цвет', inFilters: true, values: [{ id: 'blue', value: 'синий' }, { id: 'red', value: 'красный' }] },
    { id: 'note', name: 'Примечание', inFilters: false, values: [{ id: 'n1', value: 'хлопок' }] },
  ]; // prettier-ignore
  const variants: FacetVariant[] = [
    { productId: 'p1', price: 1000, valueIds: ['r98', 'blue', 'n1'] },
    { productId: 'p1', price: 1200, valueIds: ['r104', 'blue'] },
    { productId: 'p2', price: 3000, valueIds: ['r104', 'red'] },
    { productId: 'p3', price: 500, valueIds: [] },
  ];

  it('без фильтров: товары, значения с числом товаров, цена', () => {
    expect(computeFacets(variants, attributes, { valueIds: [] })).toEqual({
      total: 3,
      attributes: [
        { id: 'rost', name: 'Рост', values: [{ id: 'r98', value: '98', count: 1 }, { id: 'r104', value: '104', count: 2 }] },
        { id: 'color', name: 'Цвет', values: [{ id: 'blue', value: 'синий', count: 1 }, { id: 'red', value: 'красный', count: 1 }] },
      ],
      price: { min: 500, max: 3000 },
    }); // prettier-ignore
  });

  it('значения свойства — без фильтра по нему самому, цена — без фильтра по цене', () => {
    const facets = computeFacets(variants, attributes, { valueIds: ['r98'], priceMax: 1100 });
    expect(facets.total).toBe(1);
    expect(facets.attributes.find((a) => a.id === 'rost')!.values.map((v) => [v.value, v.count])).toEqual([['98', 1]]);
    expect(facets.attributes.find((a) => a.id === 'color')!.values.map((v) => [v.value, v.count])).toEqual([
      ['синий', 1],
    ]);
    expect(facets.price).toEqual({ min: 1000, max: 1000 });
    // ИЛИ внутри свойства, И между свойствами
    expect(computeFacets(variants, attributes, { valueIds: ['r98', 'r104'] }).total).toBe(2);
    expect(computeFacets(variants, attributes, { valueIds: ['r104', 'blue'] }).total).toBe(1);
  });

  it('пустая выборка — нули', () => {
    expect(computeFacets([], attributes, { valueIds: [] })).toEqual({
      total: 0,
      attributes: [],
      price: { min: 0, max: 0 },
    });
  });

  it('группы значений: неизвестные пропускаются, повторы — один раз; фильтр по вариантам', () => {
    const attributeOf = new Map([
      ['r98', 'rost'],
      ['r104', 'rost'],
      ['blue', 'color'],
    ]);
    const groups = groupValues(['r98', 'blue', 'gone', 'r104', 'r98'], attributeOf);
    expect([...groups]).toEqual([
      ['rost', ['r98', 'r104']],
      ['color', ['blue']],
    ]);
    expect(hasVariantFilter(new Map(), { valueIds: ['gone'] })).toBe(false);
    expect(hasVariantFilter(new Map(), { valueIds: [], priceMin: 0 })).toBe(true);
    expect(hasVariantFilter(groups, { valueIds: [] })).toBe(true);
  });
});

describe('курсор с несколькими ключами', () => {
  const id = '0192d000-0000-7000-8000-000000000001';

  it('туда и обратно; ключ другой формы — 422', () => {
    const cursor = encodeCursor({ sort: 'price_asc', key: [1, 4500], id });
    expect(decodeCursor(cursor, 'price_asc', 2)).toEqual({ sort: 'price_asc', key: [1, 4500], id });
    const invalid = expect.objectContaining({ code: 'validation_failed' });
    expect(() => decodeCursor(cursor, 'price_asc')).toThrow(invalid);
    expect(() => decodeCursor(cursor, 'price_asc', 3)).toThrow(invalid);
    expect(() => decodeCursor(encodeCursor({ sort: 'price_asc', key: 4500, id }), 'price_asc', 2)).toThrow(invalid);
  });
});
