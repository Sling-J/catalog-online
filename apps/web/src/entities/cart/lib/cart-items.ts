import type { CartItem } from '../types';

export const MAX_ITEM_QUANTITY = 999;

const limitOf = (item: CartItem) => Math.min(item.maxQuantity ?? MAX_ITEM_QUANTITY, MAX_ITEM_QUANTITY);

/** Добавить позицию; тот же вариант увеличивает количество (не больше остатка) и обновляет снимок. */
export function addItem(items: CartItem[], added: CartItem): CartItem[] {
  const existing = items.find((item) => item.variantId === added.variantId);
  if (!existing) return [...items, { ...added, quantity: Math.min(added.quantity, limitOf(added)) }];
  return items.map((item) =>
    item.variantId === added.variantId
      ? { ...added, quantity: Math.min(item.quantity + added.quantity, limitOf(added)) }
      : item,
  );
}

/** Новое количество; не меньше 1 и не больше остатка. Убирать позицию — отдельное действие. */
export function setQuantity(items: CartItem[], variantId: string, quantity: number): CartItem[] {
  return items.map((item) =>
    item.variantId === variantId ? { ...item, quantity: Math.max(1, Math.min(quantity, limitOf(item))) } : item,
  );
}

export const removeItem = (items: CartItem[], variantId: string): CartItem[] =>
  items.filter((item) => item.variantId !== variantId);

export const cartCount = (items: CartItem[]): number => items.reduce((sum, item) => sum + item.quantity, 0);

export const cartTotal = (items: CartItem[]): number =>
  items.reduce((sum, item) => sum + item.quantity * item.price, 0);
