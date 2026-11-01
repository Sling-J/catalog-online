import type { StorefrontFacets } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import {
  buildFilterSections,
  countActiveFilters,
  getActiveValueFilters,
  parsePrice,
  toggleValue,
} from '../filter-sections';

const value = (id: string, label: string, count = 1) => ({ id, value: label, count });

const all: StorefrontFacets = {
  total: 10,
  price: { min: 100, max: 900 },
  attributes: [
    { id: 'h', name: 'Рост', values: [value('h98', '98'), value('h104', '104'), value('h110', '110')] },
    { id: 's', name: 'Размер обуви', values: [value('s25', '25')] },
  ],
};

const current: StorefrontFacets = {
  total: 3,
  price: { min: 100, max: 400 },
  attributes: [{ id: 'h', name: 'Рост', values: [value('h98', '98'), value('h104', '104')] }],
};

describe('buildFilterSections', () => {
  it('показывает только значения текущей выборки и скрывает пустые свойства', () => {
    const sections = buildFilterSections(all, current, []);
    expect(sections.map((s) => s.id)).toEqual(['h']);
    expect(sections[0]!.values.map((v) => v.id)).toEqual(['h98', 'h104']);
  });

  it('выбранное значение остаётся, даже если в выборке его уже нет', () => {
    const sections = buildFilterSections(all, current, ['h110', 's25']);
    expect(sections.find((s) => s.id === 'h')!.values.map((v) => [v.id, v.selected])).toEqual([
      ['h98', false],
      ['h104', false],
      ['h110', true],
    ]);
    expect(sections.map((s) => s.id)).toEqual(['h', 's']);
  });
});

describe('getActiveValueFilters', () => {
  it('подписывает выбранные значения названием свойства и пропускает неизвестные', () => {
    expect(getActiveValueFilters(all, ['h104', 'zzz', 's25'])).toEqual([
      { id: 'h104', attributeName: 'Рост', value: '104' },
      { id: 's25', attributeName: 'Размер обуви', value: '25' },
    ]);
  });
});

describe('countActiveFilters', () => {
  it('значения и диапазон цены считаются по одному', () => {
    expect(countActiveFilters({ values: [] })).toBe(0);
    expect(countActiveFilters({ values: ['a', 'b'] })).toBe(2);
    expect(countActiveFilters({ values: ['a'], priceMin: 100, priceMax: 500 })).toBe(2);
    expect(countActiveFilters({ values: [], priceMax: 500 })).toBe(1);
    expect(countActiveFilters({ values: [], priceMin: 0 })).toBe(1);
  });
});

describe('toggleValue / parsePrice', () => {
  it('переключает значение', () => {
    expect(toggleValue(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleValue(['a', 'b'], 'a')).toEqual(['b']);
  });

  it('цена: берёт цифры, пустое — не задано', () => {
    expect(parsePrice('3 500')).toBe(3500);
    expect(parsePrice('')).toBeUndefined();
    expect(parsePrice('abc')).toBeUndefined();
    expect(parsePrice('0')).toBe(0);
  });
});
