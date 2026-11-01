import { describe, expect, it } from 'vitest';

import { toProductParams, validateCatalogSearch } from '../catalog-search';

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
});

describe('toProductParams', () => {
  it('переименовывает category в categoryId', () => {
    expect(toProductParams({ category: 'abc', sort: 'price_desc' })).toEqual({
      categoryId: 'abc',
      sort: 'price_desc',
    });
  });
});
