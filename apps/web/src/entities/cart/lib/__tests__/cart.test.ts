import { describe, expect, it } from 'vitest';

import type { CartItem } from '../../types';
import { addItem, cartCount, cartTotal, removeItem, setQuantity } from '../cart-items';
import { parseCart, serializeCart } from '../cart-storage';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 'v1',
  quantity: 1,
  productShortId: 'abcde',
  slug: 'kurtka',
  name: 'Куртка',
  variantLabel: 'Рост 104',
  price: 1000,
  photo: '/demo/jacket.jpg',
  maxQuantity: null,
  ...overrides,
});

describe('addItem', () => {
  it('новый вариант добавляется в конец', () => {
    expect(addItem([item()], item({ variantId: 'v2' })).map((i) => i.variantId)).toEqual(['v1', 'v2']);
  });

  it('тот же вариант увеличивает количество и обновляет цену', () => {
    const result = addItem([item({ quantity: 2 })], item({ price: 1200 }));
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ quantity: 3, price: 1200 });
  });

  it('количество не больше остатка', () => {
    expect(addItem([item({ quantity: 2, maxQuantity: 3 })], item({ maxQuantity: 3 }))[0]!.quantity).toBe(3);
    expect(addItem([item({ quantity: 3, maxQuantity: 3 })], item({ maxQuantity: 3 }))[0]!.quantity).toBe(3);
  });
});

describe('setQuantity / removeItem', () => {
  it('держит количество между 1 и остатком', () => {
    const items = [item({ maxQuantity: 5 })];
    expect(setQuantity(items, 'v1', 4)[0]!.quantity).toBe(4);
    expect(setQuantity(items, 'v1', 0)[0]!.quantity).toBe(1);
    expect(setQuantity(items, 'v1', 99)[0]!.quantity).toBe(5);
  });

  it('удаляет позицию', () => {
    expect(removeItem([item(), item({ variantId: 'v2' })], 'v1').map((i) => i.variantId)).toEqual(['v2']);
  });
});

describe('cartCount / cartTotal', () => {
  it('считает штуки и сумму', () => {
    const items = [item({ quantity: 2, price: 1000 }), item({ variantId: 'v2', quantity: 1, price: 500 })];
    expect(cartCount(items)).toBe(3);
    expect(cartTotal(items)).toBe(2500);
    expect(cartTotal([])).toBe(0);
  });
});

describe('parseCart', () => {
  it('читает то, что записал serializeCart', () => {
    const items = [item(), item({ variantId: 'v2', photo: null, maxQuantity: 4 })];
    expect(parseCart(serializeCart(items))).toEqual(items);
  });

  it('мусор, чужие данные и пустое дают пустую корзину', () => {
    expect(parseCart(null)).toEqual([]);
    expect(parseCart('')).toEqual([]);
    expect(parseCart('{oops')).toEqual([]);
    expect(parseCart('{"a":1}')).toEqual([]);
  });

  it('битые позиции отбрасываются, остальные остаются', () => {
    const raw = JSON.stringify([item(), { variantId: 'x' }, item({ variantId: 'v3', quantity: 0 }), 42, null]);
    expect(parseCart(raw).map((i) => i.variantId)).toEqual(['v1']);
  });
});
