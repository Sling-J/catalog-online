import { allSettled, fork } from 'effector';
import { describe, expect, it, vi } from 'vitest';

import { $items, cartClosed, variantAdded, type CartItem } from '@/entities/cart';

import { $sentOrder, orderSent, trackOrderClickFx } from '../order.model';

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
});
