import { describe, expect, it } from 'vitest';

import { nextSort, sortDirection } from '../table-sort';

describe('nextSort', () => {
  it('цена: дешёвые → дорогие → новые', () => {
    expect(nextSort('price', undefined)).toBe('price_asc');
    expect(nextSort('price', 'price_asc')).toBe('price_desc');
    expect(nextSort('price', 'price_desc')).toBeUndefined();
  });

  it('название и остаток: включить и вернуть к новым', () => {
    expect(nextSort('name', undefined)).toBe('name');
    expect(nextSort('name', 'name')).toBeUndefined();
    expect(nextSort('stock', 'price_desc')).toBe('stock_asc');
    expect(nextSort('stock', 'stock_asc')).toBeUndefined();
  });

  it('другая колонка начинает свой порядок заново', () => {
    expect(nextSort('price', 'name')).toBe('price_asc');
    expect(nextSort('name', 'price_desc')).toBe('name');
  });
});

describe('sortDirection', () => {
  it('стрелка только у колонки текущего порядка', () => {
    expect(sortDirection('price', 'price_desc')).toBe('desc');
    expect(sortDirection('price', 'name')).toBeNull();
    expect(sortDirection('name', 'name')).toBe('asc');
    expect(sortDirection('stock', undefined)).toBeNull();
  });
});
