import { allSettled, fork } from 'effector';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { CartItem } from '@/entities/cart/types';

import {
  $checkState,
  $comment,
  $count,
  $items,
  $notices,
  $open,
  $total,
  cartCleared,
  cartClosed,
  cartMounted,
  cartOpened,
  checkCartFx,
  commentChanged,
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

  describe('перепроверка при открытии', () => {
    const response = (
      lines: { variantId: string; status: 'ok' | 'out_of_stock'; quantity: number; price: number | null }[],
    ) => ({
      items: lines,
      total: 0,
    });

    it('применяет ответ: новая цена, закончившееся не считается в сумме', async () => {
      const scope = fork({
        handlers: [
          [
            checkCartFx,
            async () =>
              response([
                { variantId: 'v1', status: 'ok', quantity: 2, price: 1200 },
                { variantId: 'v2', status: 'out_of_stock', quantity: 0, price: null },
              ]),
          ],
        ],
      });
      await allSettled(variantAdded, { scope, params: item({ quantity: 2 }) });
      await allSettled(variantAdded, { scope, params: item({ variantId: 'v2', price: 500 }) });

      await allSettled(cartOpened, { scope, params: 'aigerim-kids' });

      expect(scope.getState($open)).toBe(true);
      expect(scope.getState($checkState)).toBe('done');
      expect(scope.getState($items).find((i) => i.variantId === 'v1')!.price).toBe(1200);
      expect(scope.getState($notices).v1).toEqual([{ kind: 'price_changed', from: 1000, to: 1200 }]);
      expect(scope.getState($notices).v2).toEqual([{ kind: 'out_of_stock' }]);
      // закрытая позиция остаётся в корзине, но не считается
      expect(scope.getState($items)).toHaveLength(2);
      expect(scope.getState($count)).toBe(2);
      expect(scope.getState($total)).toBe(2400);
    });

    it('нет связи: корзина остаётся как была, состояние — failed', async () => {
      const scope = fork({
        handlers: [
          [
            checkCartFx,
            async () => {
              throw new Error('Failed to fetch');
            },
          ],
        ],
      });
      await allSettled(variantAdded, { scope, params: item() });
      await allSettled(cartOpened, { scope, params: 'aigerim-kids' });

      expect(scope.getState($checkState)).toBe('failed');
      expect(scope.getState($items)).toHaveLength(1);
      expect(scope.getState($notices)).toEqual({});
    });

    it('пустую корзину не проверяет', async () => {
      let called = false;
      const scope = fork({
        handlers: [
          [
            checkCartFx,
            async () => {
              called = true;
              return response([]);
            },
          ],
        ],
      });
      await allSettled(cartOpened, { scope, params: 'aigerim-kids' });
      expect(called).toBe(false);
      expect(scope.getState($checkState)).toBe('idle');
    });

    it('закрытие корзины и комментарий', async () => {
      const scope = fork();
      await allSettled(cartOpened, { scope, params: 'aigerim-kids' });
      await allSettled(commentChanged, { scope, params: 'Позвоните перед приходом' });
      expect(scope.getState($comment)).toBe('Позвоните перед приходом');
      await allSettled(cartClosed, { scope });
      expect(scope.getState($open)).toBe(false);
      await allSettled(commentChanged, { scope, params: 'я'.repeat(900) });
      expect(scope.getState($comment)).toHaveLength(500);
    });
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
