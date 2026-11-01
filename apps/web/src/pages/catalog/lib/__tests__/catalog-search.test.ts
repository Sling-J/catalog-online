import { describe, expect, it } from 'vitest';

import { selectedValues, toProductParams, validateCatalogSearch } from '../catalog-search';

const A = '0192d000-0000-7000-8000-000000000104';
const B = '0192d000-0000-7000-8000-000000000110';

describe('validateCatalogSearch', () => {
  it('оставляет категорию и сортировку', () => {
    expect(validateCatalogSearch({ category: 'abc', sort: 'price_asc' })).toEqual({
      category: 'abc',
      sort: 'price_asc',
    });
  });

  it('сортировка по умолчанию в адрес не попадает', () => {
    expect(validateCatalogSearch({ sort: 'new' })).toEqual({});
  });

  it('отбрасывает неверное и лишнее', () => {
    expect(validateCatalogSearch({ category: 42, sort: 'random', utm: 'x' })).toEqual({});
    expect(validateCatalogSearch({ category: '' })).toEqual({});
  });

  it('поиск: обрезает пробелы и длину, пустой отбрасывает', () => {
    expect(validateCatalogSearch({ q: '  платье ' })).toEqual({ q: 'платье' });
    expect(validateCatalogSearch({ q: '   ' })).toEqual({});
    expect(validateCatalogSearch({ q: 'я'.repeat(300) }).q).toHaveLength(100);
  });

  it('значения фильтров: только настоящие id', () => {
    expect(validateCatalogSearch({ values: `${A},${B}` })).toEqual({ values: `${A},${B}` });
    expect(validateCatalogSearch({ values: `${A},oops,${B}` })).toEqual({ values: `${A},${B}` });
    expect(validateCatalogSearch({ values: 'oops' })).toEqual({});
  });

  it('цена: только целые неотрицательные числа', () => {
    expect(validateCatalogSearch({ priceMin: 3500, priceMax: 20000 })).toEqual({ priceMin: 3500, priceMax: 20000 });
    expect(validateCatalogSearch({ priceMin: -1, priceMax: 'много' })).toEqual({});
    expect(validateCatalogSearch({ priceMin: 12.5 })).toEqual({});
    expect(validateCatalogSearch({ priceMin: 0 })).toEqual({ priceMin: 0 });
  });
});

describe('selectedValues', () => {
  it('разбирает список и пустое значение', () => {
    expect(selectedValues({ values: `${A},${B}` })).toEqual([A, B]);
    expect(selectedValues({})).toEqual([]);
  });
});

describe('toProductParams', () => {
  it('переименовывает category в categoryId и раскладывает значения в массив', () => {
    expect(
      toProductParams({ category: 'abc', sort: 'price_desc', q: 'шапка', values: `${A},${B}`, priceMin: 5 }),
    ).toEqual({
      categoryId: 'abc',
      sort: 'price_desc',
      q: 'шапка',
      values: [A, B],
      priceMin: 5,
      priceMax: undefined,
    });
  });

  it('без значений массива нет', () => {
    expect(toProductParams({}).values).toBeUndefined();
  });
});
