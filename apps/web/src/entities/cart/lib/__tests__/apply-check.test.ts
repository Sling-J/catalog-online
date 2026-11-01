import type { CartItemChecked } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import type { CartItem } from '../../types';
import { applyCheck, isBlocked } from '../apply-check';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 'v1',
  quantity: 2,
  productShortId: 'abcde',
  slug: 'kurtka',
  name: 'Куртка',
  variantLabel: 'Рост 104',
  price: 1000,
  photo: null,
  maxQuantity: null,
  ...overrides,
});

const line = (overrides: Partial<CartItemChecked> = {}): CartItemChecked => ({
  variantId: 'v1',
  status: 'ok',
  quantity: 2,
  price: 1000,
  ...overrides,
});

describe('applyCheck', () => {
  it('без изменений — корзина та же, плашек нет', () => {
    const result = applyCheck([item()], [line()]);
    expect(result.items).toEqual([item()]);
    expect(result.notices).toEqual({});
  });

  it('цена изменилась: берёт новую и запоминает прежнюю', () => {
    const result = applyCheck([item()], [line({ price: 1200 })]);
    expect(result.items[0]!.price).toBe(1200);
    expect(result.notices.v1).toEqual([{ kind: 'price_changed', from: 1000, to: 1200 }]);
  });

  it('остаток меньше, чем в корзине: количество уменьшается до остатка', () => {
    const result = applyCheck([item({ quantity: 3 })], [line({ quantity: 1 })]);
    expect(result.items[0]!.quantity).toBe(1);
    expect(result.notices.v1).toEqual([{ kind: 'quantity_reduced', to: 1 }]);
  });

  it('цена и количество вместе — две плашки', () => {
    const result = applyCheck([item({ quantity: 3 })], [line({ quantity: 2, price: 900 })]);
    expect(result.notices.v1!.map((notice) => notice.kind)).toEqual(['quantity_reduced', 'price_changed']);
  });

  it('закончилось: позиция остаётся, помечена, количество и цена не трогаются', () => {
    const result = applyCheck([item()], [line({ status: 'out_of_stock', quantity: 0, price: null })]);
    expect(result.items).toEqual([item()]);
    expect(result.notices.v1).toEqual([{ kind: 'out_of_stock' }]);
    expect(isBlocked(result.notices.v1)).toBe(true);
  });

  it('нулевой остаток считается «закончилось», даже со статусом ok', () => {
    expect(applyCheck([item()], [line({ quantity: 0 })]).notices.v1).toEqual([{ kind: 'out_of_stock' }]);
  });

  it('товар скрыт или удалён — unavailable', () => {
    const result = applyCheck([item()], [line({ status: 'unavailable', quantity: 0, price: null })]);
    expect(result.notices.v1).toEqual([{ kind: 'unavailable' }]);
    expect(isBlocked(result.notices.v1)).toBe(true);
  });

  it('позиции, которых нет в ответе, не трогает', () => {
    const result = applyCheck([item(), item({ variantId: 'v2' })], [line()]);
    expect(result.items).toHaveLength(2);
    expect(result.notices).toEqual({});
  });
});

describe('isBlocked', () => {
  it('цена и количество не блокируют позицию', () => {
    expect(isBlocked([{ kind: 'price_changed', from: 1, to: 2 }])).toBe(false);
    expect(isBlocked([{ kind: 'quantity_reduced', to: 1 }])).toBe(false);
    expect(isBlocked(undefined)).toBe(false);
  });
});
