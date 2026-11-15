import { allSettled, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';

import { $items, cartClosed, variantAdded, type CartItem } from '@/entities/cart';

import { $demoOrder, $sentOrder, demoOrderClosed, demoOrderShown, orderSent, trackOrderClickFx } from '../order.model';

const item: CartItem = {
  variantId: 'v1',
  quantity: 2,
  productShortId: 'abcde',
  slug: 'kurtka',
  name: 'Куртка',
  variantLabel: 'Рост: 104',
  price: 1000,
  photo: null,
  maxQuantity: null,
};

const order = {
  subdomain: 'aigerim-kids',
  url: 'https://wa.me/1?text=x',
  text: 'x',
  count: 2,
  total: 2000,
  photos: [null],
};

describe('заказ через WhatsApp', () => {
  it('очищает корзину, запоминает заявку и отправляет событие order_click', async () => {
    const track = vi.fn(async () => {});
    const scope = fork({ handlers: [[trackOrderClickFx, track]] });
    await allSettled(variantAdded, { scope, params: item });

    await allSettled(orderSent, { scope, params: order });

    expect(scope.getState($items)).toEqual([]);
    expect(scope.getState($sentOrder)).toEqual(order);
    expect(track).toHaveBeenCalledWith('aigerim-kids');
  });

  it('при закрытии шторки экран «Отправлено» сбрасывается', async () => {
    const scope = fork({ handlers: [[trackOrderClickFx, async () => {}]] });
    await allSettled(orderSent, { scope, params: order });
    await allSettled(cartClosed, { scope });
    expect(scope.getState($sentOrder)).toBeNull();
  });

  it('демо-магазин: показывает текст заявки, корзина остаётся, событие не отправляется', async () => {
    const track = vi.fn(async () => {});
    const scope = fork({ handlers: [[trackOrderClickFx, track]] });
    await allSettled(variantAdded, { scope, params: item });

    await allSettled(demoOrderShown, { scope, params: 'текст заявки' });
    expect(scope.getState($demoOrder)).toBe('текст заявки');
    expect(scope.getState($items)).toHaveLength(1);
    expect(track).not.toHaveBeenCalled();

    await allSettled(demoOrderClosed, { scope });
    expect(scope.getState($demoOrder)).toBeNull();
    await allSettled(demoOrderShown, { scope, params: 'ещё раз' });
    await allSettled(cartClosed, { scope });
    expect(scope.getState($demoOrder)).toBeNull();
  });
});
