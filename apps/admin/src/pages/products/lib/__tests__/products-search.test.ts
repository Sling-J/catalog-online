import { describe, expect, it } from 'vitest';

import { toListParams, validateProductsSearch } from '../products-search';

describe('validateProductsSearch', () => {
  it('берёт поиск, вкладку и категорию; незнакомое и пустое отбрасывает', () => {
    expect(validateProductsSearch({ q: '  куртка ', filter: 'hidden', category: 'c1', page: 2 })).toEqual({
      q: 'куртка',
      filter: 'hidden',
      category: 'c1',
    });
    expect(validateProductsSearch({ q: ' ', filter: 'all', category: '' })).toEqual({});
  });

  it('в запрос — categoryId', () => {
    expect(toListParams({ q: 'шапка', category: 'c1' })).toEqual({
      q: 'шапка',
      filter: undefined,
      categoryId: 'c1',
      sort: undefined,
    });
  });

  it('сортировка (E3): знакомая — в адрес, «новые» и незнакомая — нет', () => {
    expect(validateProductsSearch({ sort: 'price_desc' })).toEqual({ sort: 'price_desc' });
    expect(validateProductsSearch({ sort: 'new' })).toEqual({});
    expect(validateProductsSearch({ sort: 'cheap' })).toEqual({});
    expect(toListParams({ sort: 'stock_asc' }).sort).toBe('stock_asc');
  });
});
