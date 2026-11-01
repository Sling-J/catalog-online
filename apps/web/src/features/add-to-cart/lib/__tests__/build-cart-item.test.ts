import type { StorefrontProduct } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import { buildCartItem } from '../build-cart-item';

const image = (url: string) => ({ width: 800, height: 1000, sizes: { 320: url, 640: url, 1280: url } });

const product: StorefrontProduct = {
  id: 'p',
  shortId: 'abcde',
  slug: 'kurtka',
  name: 'Куртка',
  category: null,
  photos: [image('/demo/jacket.jpg')],
  attributes: [{ id: 'h', name: 'Рост', values: [{ id: 'h104', value: '104' }] }],
  variants: [{ id: 'v1', valueIds: ['h104'], price: 18900, stock: { level: 'low', quantity: 2 } }],
};

describe('buildCartItem', () => {
  it('собирает позицию со снимком товара', () => {
    expect(buildCartItem(product, product.variants[0]!)).toEqual({
      variantId: 'v1',
      quantity: 1,
      productShortId: 'abcde',
      slug: 'kurtka',
      name: 'Куртка',
      variantLabel: 'Рост: 104',
      price: 18900,
      photo: '/demo/jacket.jpg',
      maxQuantity: 2,
    });
  });

  it('без точного остатка и без фото — null', () => {
    const plain = { ...product, photos: [] };
    const item = buildCartItem(plain, { ...product.variants[0]!, stock: { level: 'in', quantity: null } });
    expect(item.photo).toBeNull();
    expect(item.maxQuantity).toBeNull();
  });
});
