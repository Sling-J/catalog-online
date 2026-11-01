import { checkStorefrontCart } from '@catalog/contract';

import type { CartItem } from '@/entities/cart/types';

/** Перепроверка цен и наличия: уходят только варианты и количества, магазин — по адресу (FR-V7). */
export async function checkCart(subdomain: string, items: CartItem[]) {
  const { data } = await checkStorefrontCart({
    path: { subdomain },
    body: { items: items.map(({ variantId, quantity }) => ({ variantId, quantity })) },
    throwOnError: true,
  });
  return data;
}
