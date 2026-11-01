import type { CartItem } from '../types';
import { MAX_ITEM_QUANTITY } from './cart-items';

/** Ключ в localStorage. У каждого магазина свой адрес, значит и своё хранилище — корзины не смешиваются. */
export const CART_STORAGE_KEY = 'catalog:cart:v1';

const isText = (value: unknown): value is string => typeof value === 'string';

function toCartItem(raw: unknown): CartItem | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const item = raw as Record<string, unknown>;
  const { variantId, quantity, productShortId, slug, name, variantLabel, price, photo, maxQuantity } = item;
  if (!isText(variantId) || !isText(productShortId) || !isText(slug) || !isText(name) || !isText(variantLabel)) {
    return null;
  }
  if (!Number.isInteger(quantity) || (quantity as number) < 1 || (quantity as number) > MAX_ITEM_QUANTITY) return null;
  if (!Number.isInteger(price) || (price as number) < 0) return null;
  return {
    variantId,
    quantity: quantity as number,
    productShortId,
    slug,
    name,
    variantLabel,
    price: price as number,
    photo: isText(photo) ? photo : null,
    maxQuantity: Number.isInteger(maxQuantity) && (maxQuantity as number) > 0 ? (maxQuantity as number) : null,
  };
}

/** Корзина из строки хранилища. Мусор и чужие данные отбрасываются: лучше пустая корзина, чем сломанная страница. */
export function parseCart(raw: string | null): CartItem[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data.flatMap((entry) => toCartItem(entry) ?? []);
  } catch {
    return [];
  }
}

export const serializeCart = (items: CartItem[]): string => JSON.stringify(items);
