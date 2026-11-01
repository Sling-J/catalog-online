import { allSettled, fork } from 'effector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CartItem } from '@/entities/cart/types';

import {
  $count,
  $items,
  $total,
  cartCleared,
  cartMounted,
  itemRemoved,
  quantityChanged,
  variantAdded,
} from '../cart.model';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 'v1',
  quantity: 1,
  productShortId: 'abcde',
  slug: 'kurtka',
  name: 'Куртка',
  variantLabel: 'Рост 104',
  price: 1000,
  photo: null,
  maxQuantity: null,
  ...overrides,
});

// простое хранилище вместо localStorage (тесты идут в Node)
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => void data.set(key, value),
    data,
  };
}

beforeEach(() => {
  vi.stubGlobal('localStorage', fakeStorage());
});
afterEach(() => vi.unstubAllGlobals());

describe('корзина (Effector)', () => {
  it('добавляет, меняет количество и удаляет', async () => {
    const scope = fork();
    await allSettled(variantAdded, { scope, params: item() });
    await allSettled(variantAdded, { scope, params: item({ variantId: 'v2', price: 500 }) });
    await allSettled(variantAdded, { scope, params: item() });
    expect(scope.getState($items).map((i) => [i.variantId, i.quantity])).toEqual([
      ['v1', 2],
      ['v2', 1],
    ]);
    expect(scope.getState($count)).toBe(3);
    expect(scope.getState($total)).toBe(2500);

    await allSettled(quantityChanged, { scope, params: { variantId: 'v2', quantity: 4 } });
    expect(scope.getState($count)).toBe(6);

    await allSettled(itemRemoved, { scope, params: 'v1' });
    expect(scope.getState($items).map((i) => i.variantId)).toEqual(['v2']);

    await allSettled(cartCleared, { scope });
    expect(scope.getState($items)).toEqual([]);
  });

  it('читает сохранённую корзину после монтирования и пишет изменения обратно', async () => {
    const storage = fakeStorage({ 'catalog:cart:v1': JSON.stringify([item({ quantity: 2 })]) });
    vi.stubGlobal('localStorage', storage);
    const scope = fork();

    await allSettled(cartMounted, { scope });
    expect(scope.getState($count)).toBe(2);

    await allSettled(variantAdded, { scope, params: item({ variantId: 'v9' }) });
    expect(JSON.parse(storage.data.get('catalog:cart:v1')!)).toHaveLength(2);
  });

  it('пока корзина не прочитана, сохранённое не затирается', async () => {
    const saved = JSON.stringify([item({ variantId: 'old' })]);
    const storage = fakeStorage({ 'catalog:cart:v1': saved });
    vi.stubGlobal('localStorage', storage);
    const scope = fork();

    // покупатель успел добавить товар до монтирования: запись не должна затереть сохранённое
    await allSettled(variantAdded, { scope, params: item({ variantId: 'new' }) });
    expect(storage.data.get('catalog:cart:v1')).toBe(saved);
  });
});
