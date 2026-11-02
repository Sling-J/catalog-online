import { combine, createEffect, createEvent, createStore, sample } from 'effector';

import { checkCart } from '@/entities/cart/api';
import {
  addItem,
  applyCheck,
  cartCount,
  cartTotal,
  CART_STORAGE_KEY,
  isBlocked,
  parseCart,
  removeItem,
  restoreItem,
  serializeCart,
  setQuantity,
} from '@/entities/cart/lib';
import type { CartItem, CartNotices, CheckState } from '@/entities/cart/types';

// Корзина живёт только в браузере: на сервере событий нет, а глобальные сторы не делят состояние
// между покупателями, потому что на сервере его никто не меняет (ADR 0001). Хранилище читаем после
// гидратации (`cartMounted`), чтобы разметка сервера и клиента совпала.

export const MAX_COMMENT_LENGTH = 500;
/** Сколько после удаления видна плашка «… — убрано · Вернуть», мс. */
export const UNDO_MS = 5000;

/** Последняя убранная позиция и её место в списке — для «Вернуть». */
export type RemovedItem = { item: CartItem; index: number };

export const cartMounted = createEvent();
export const variantAdded = createEvent<CartItem>();
export const quantityChanged = createEvent<{ variantId: string; quantity: number }>();
export const itemRemoved = createEvent<string>();
/** «Вернуть» последнюю убранную позицию — пока не прошло UNDO_MS. */
export const itemRestored = createEvent();
export const cartCleared = createEvent();
/** Открыть корзину; цены и наличие перепроверяются для магазина с этим поддоменом (FR-V7). */
export const cartOpened = createEvent<string>();
export const cartClosed = createEvent();
export const commentChanged = createEvent<string>();

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
export const checkCartFx = createEffect(({ subdomain, items }: { subdomain: string; items: CartItem[] }) =>
  checkCart(subdomain, items),
);

export const $items = createStore<CartItem[]>([], { name: 'cart.items' })
  .on(readCartFx.doneData, (_, restored) => restored)
  .on(variantAdded, addItem)
  .on(quantityChanged, (items, { variantId, quantity }) => setQuantity(items, variantId, quantity))
  .reset(cartCleared);

// убираем позицию и запоминаем её с местом в списке, чтобы можно было вернуть
const removedWithPlace = sample({
  clock: itemRemoved,
  source: $items,
  filter: (items, variantId) => items.some((item) => item.variantId === variantId),
  fn: (items, variantId): RemovedItem => {
    const index = items.findIndex((item) => item.variantId === variantId);
    return { item: items[index]!, index };
  },
});
$items.on(removedWithPlace, (items, { item }) => removeItem(items, item.variantId));

// плашка «Вернуть» живёт UNDO_MS, потом позиция забывается
export const forgetRemovedFx = createEffect(
  (removed: RemovedItem) => new Promise<RemovedItem>((resolve) => setTimeout(() => resolve(removed), UNDO_MS)),
);
sample({ clock: removedWithPlace, target: forgetRemovedFx });

export const $removed = createStore<RemovedItem | null>(null, { name: 'cart.removed' })
  .on(removedWithPlace, (_, removed) => removed)
  // забываем только ту позицию, для которой шёл таймер, а не убранную позже
  .on(forgetRemovedFx.doneData, (current, expired) => (current === expired ? null : current))
  .reset(cartCleared);

// «Вернуть»: позиция встаёт на прежнее место, плашка исчезает
const restored = sample({
  clock: itemRestored,
  source: { items: $items, removed: $removed },
  filter: (source): source is { items: CartItem[]; removed: RemovedItem } => source.removed !== null,
});
$items.on(restored, (_, { items, removed }) => restoreItem(items, removed));
$removed.on(restored, () => null);

/** Корзина прочитана из хранилища; до этого записывать нельзя — затрём сохранённое пустой. */
const $restored = createStore(false, { name: 'cart.restored' }).on(readCartFx.finally, () => true);

/** Изменения по позициям после последней перепроверки; в хранилище не пишутся. */
export const $notices = createStore<CartNotices>({}, { name: 'cart.notices' })
  .on(itemRemoved, (notices, variantId) => {
    const { [variantId]: _removed, ...rest } = notices;
    return rest;
  })
  .reset(cartCleared);

export const $checkState = createStore<CheckState>('idle', { name: 'cart.checkState' })
  .on(checkCartFx, () => 'loading')
  .on(checkCartFx.done, () => 'done')
  .on(checkCartFx.fail, () => 'failed')
  .reset(cartCleared);

// после оформления корзина очищается, а шторка остаётся открытой — на ней экран «Отправлено»
export const $open = createStore(false, { name: 'cart.open' })
  .on(cartOpened, () => true)
  .on(cartClosed, () => false);

export const $comment = createStore('', { name: 'cart.comment' })
  .on(commentChanged, (_, text) => text.slice(0, MAX_COMMENT_LENGTH))
  .reset(cartCleared);

/** Позиции, которые можно заказать: закончившиеся и скрытые остаются в списке серыми, но не считаются. */
export const $payable = combine($items, $notices, (items, notices) =>
  items.filter((item) => !isBlocked(notices[item.variantId])),
);
export const $count = $payable.map(cartCount);
export const $total = $payable.map(cartTotal);

sample({ clock: [cartMounted, storageChanged], target: readCartFx });
sample({ clock: cartMounted, target: listenStorageFx });
sample({ clock: $items, filter: $restored, target: writeCartFx });

// при открытии корзины: перепроверка, если в ней что-то есть
sample({
  clock: cartOpened,
  source: $items,
  filter: (items) => items.length > 0,
  fn: (items, subdomain) => ({ subdomain, items }),
  target: checkCartFx,
});

// результат перепроверки применяем к корзине на момент ответа: позиции, удалённые за это время, пропускаются
const checkApplied = sample({
  clock: checkCartFx.doneData,
  source: $items,
  fn: (items, response) => applyCheck(items, response.items),
});
$items.on(checkApplied, (_, { items }) => items);
$notices.on(checkApplied, (_, { notices }) => notices);
