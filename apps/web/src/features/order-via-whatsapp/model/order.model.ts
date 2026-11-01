import { createEffect, createEvent, createStore, sample } from 'effector';

import { cartCleared, cartClosed } from '@/entities/cart';
import { trackOrderClick } from '@/features/order-via-whatsapp/api';
import type { SentOrder } from '@/features/order-via-whatsapp/types';

/** Покупатель нажал «Заказать через WhatsApp»: корзина очищается, показывается «Отправлено ✓» (FR-V8). */
export const orderSent = createEvent<SentOrder>();

export const $sentOrder = createStore<SentOrder | null>(null, { name: 'order.sent' })
  .on(orderSent, (_, order) => order)
  // закрыли шторку — экран «Отправлено» не должен вернуться при следующем открытии
  .reset(cartClosed);

export const trackOrderClickFx = createEffect((subdomain: string) => trackOrderClick(subdomain));

sample({ clock: orderSent, target: cartCleared });
sample({ clock: orderSent, fn: (order) => order.subdomain, target: trackOrderClickFx });
