import type { StorefrontProduct } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import { describeVariant, findVariant, getPriceRange, getValueState, toggleSelection } from '../variant-selection';

const stock = (level: 'in' | 'low' | 'out') => ({ level, quantity: null });

// два свойства: рост (98, 104) и цвет (red, blue); синий 104 закончился, красного 98 не бывает
const product: StorefrontProduct = {
  id: 'p',
  shortId: 'abcde',
  slug: 'kurtka',
  name: 'Куртка',
  category: null,
  photos: [],
  attributes: [
    {
      id: 'h',
      name: 'Рост',
      values: [
        { id: 'h98', value: '98' },
        { id: 'h104', value: '104' },
      ],
    },
    {
      id: 'c',
      name: 'Цвет',
      values: [
        { id: 'red', value: 'красный' },
        { id: 'blue', value: 'синий' },
      ],
    },
  ],
  variants: [
    { id: 'v1', valueIds: ['h98', 'blue'], price: 1000, stock: stock('in') },
    { id: 'v2', valueIds: ['h104', 'red'], price: 1200, stock: stock('low') },
    { id: 'v3', valueIds: ['h104', 'blue'], price: 1200, stock: stock('out') },
  ],
};

describe('findVariant', () => {
  it('ищет вариант, когда выбраны все свойства', () => {
    expect(findVariant(product, { h: 'h104', c: 'red' })?.id).toBe('v2');
  });

  it('пока выбрано не всё, варианта нет', () => {
    expect(findVariant(product, { h: 'h104' })).toBeUndefined();
    expect(findVariant(product, {})).toBeUndefined();
  });

  it('несуществующее сочетание — нет варианта', () => {
    expect(findVariant(product, { h: 'h98', c: 'red' })).toBeUndefined();
  });

  it('у товара без свойств вариант единственный', () => {
    const plain: StorefrontProduct = {
      ...product,
      attributes: [],
      variants: [{ id: 'only', valueIds: [], price: 500, stock: stock('in') }],
    };
    expect(findVariant(plain, {})?.id).toBe('only');
  });
});

describe('getValueState', () => {
  it('без выбора учитывает все варианты', () => {
    expect(getValueState(product, {}, 'h', 'h98')).toBe('available');
    expect(getValueState(product, {}, 'c', 'blue')).toBe('available');
  });

  it('сочетание, которого нет, — impossible', () => {
    expect(getValueState(product, { h: 'h98' }, 'c', 'red')).toBe('impossible');
  });

  it('вариант есть, но закончился, — out', () => {
    expect(getValueState(product, { h: 'h104' }, 'c', 'blue')).toBe('out');
  });

  it('значение рассматривается без учёта собственного выбора свойства', () => {
    expect(getValueState(product, { h: 'h104', c: 'red' }, 'h', 'h98')).toBe('impossible');
    expect(getValueState(product, { h: 'h98' }, 'h', 'h104')).toBe('available');
  });
});

describe('toggleSelection', () => {
  it('выбирает и снимает значение', () => {
    const picked = toggleSelection({}, 'h', 'h98');
    expect(picked).toEqual({ h: 'h98' });
    expect(toggleSelection(picked, 'h', 'h98')).toEqual({});
    expect(toggleSelection(picked, 'h', 'h104')).toEqual({ h: 'h104' });
  });
});

describe('getPriceRange / describeVariant', () => {
  it('диапазон цен по вариантам', () => {
    expect(getPriceRange(product)).toEqual({ min: 1000, max: 1200 });
  });

  it('подпись варианта собирается из значений свойств', () => {
    expect(describeVariant(product, product.variants[1]!)).toBe('Рост: 104, Цвет: красный');
  });
});
