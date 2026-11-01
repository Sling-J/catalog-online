import { createEffect, createEvent, createStore, sample } from 'effector';

import {
  addItem,
  cartCount,
  cartTotal,
  CART_STORAGE_KEY,
  parseCart,
  removeItem,
  serializeCart,
  setQuantity,
} from '@/entities/cart/lib';
import type { CartItem } from '@/entities/cart/types';

// Корзина живёт только в браузере: на сервере событий нет, а глобальные сторы не делят состояние
// между покупателями, потому что на сервере его никто не меняет (ADR 0001). Хранилище читаем после
// гидратации (`cartMounted`), чтобы разметка сервера и клиента совпала.

export const cartMounted = createEvent();
export const variantAdded = createEvent<CartItem>();
export const quantityChanged = createEvent<{ variantId: string; quantity: number }>();
export const itemRemoved = createEvent<string>();
export const cartCleared = createEvent();

const storageChanged = createEvent();

const readCartFx = createEffect((): CartItem[] =>
  parseCart(globalThis.localStorage?.getItem(CART_STORAGE_KEY) ?? null),
);
const writeCartFx = createEffect((items: CartItem[]) => {
  try {
    globalThis.localStorage?.setItem(CART_STORAGE_KEY, serializeCart(items));
  } catch {
    // хранилище заполнено или запрещено — корзина живёт до перезагрузки страницы
  }
});
const listenStorageFx = createEffect(() => {
  // корзина, изменённая в другой вкладке этого магазина
  globalThis.addEventListener?.('storage', (event) => {
    if (event.key === CART_STORAGE_KEY) storageChanged();
  });
});

export const $items = createStore<CartItem[]>([], { name: 'cart.items' })
  .on(readCartFx.doneData, (_, restored) => restored)
  .on(variantAdded, addItem)
  .on(quantityChanged, (items, { variantId, quantity }) => setQuantity(items, variantId, quantity))
  .on(itemRemoved, removeItem)
  .reset(cartCleared);

/** Корзина прочитана из хранилища; до этого записывать нельзя — затрём сохранённое пустой. */
const $restored = createStore(false, { name: 'cart.restored' }).on(readCartFx.finally, () => true);

export const $count = $items.map(cartCount);
export const $total = $items.map(cartTotal);

sample({ clock: [cartMounted, storageChanged], target: readCartFx });
sample({ clock: cartMounted, target: listenStorageFx });
sample({ clock: $items, filter: $restored, target: writeCartFx });
