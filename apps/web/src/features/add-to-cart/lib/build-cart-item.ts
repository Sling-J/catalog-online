import type { StorefrontProduct } from '@catalog/contract';

import type { CartItem } from '@/entities/cart';
import { describeVariant } from '@/entities/product';

/** Позиция корзины из товара и выбранного варианта; остаток берём, только если магазин показывает точное число. */
export function buildCartItem(product: StorefrontProduct, variant: StorefrontProduct['variants'][number]): CartItem {
  return {
    variantId: variant.id,
    quantity: 1,
    productShortId: product.shortId,
    slug: product.slug,
    name: product.name,
    variantLabel: describeVariant(product, variant),
    price: variant.price,
    photo: product.photos[0]?.sizes[320] ?? null,
    maxQuantity: variant.stock.quantity ?? null,
  };
}
