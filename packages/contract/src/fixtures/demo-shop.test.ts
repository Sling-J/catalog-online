import { describe, expect, it } from 'vitest';

import {
  zStorefrontCategory,
  zStorefrontFacets,
  zStorefrontProduct,
  zStorefrontProductCard,
  zStorefrontShop,
} from '../gen/zod.gen.js';
import { createDemoShopData, demoShop } from './demo-shop.js';

const {
  categories: demoCategories,
  cards: demoProductCards,
  products: demoProducts,
  facets: demoFacets,
} = createDemoShopData();

// Демо-данные должны соответствовать контракту — иначе моки врут фронту.
describe('демо-магазин соответствует контракту', () => {
  it('магазин', () => {
    expect(() => zStorefrontShop.parse(demoShop)).not.toThrow();
  });

  it('категории, карточки, товары, фильтры', () => {
    demoCategories.forEach((category) => zStorefrontCategory.parse(category));
    demoProductCards.forEach((card) => zStorefrontProductCard.parse(card));
    demoProducts.forEach((product) => zStorefrontProduct.parse(product));
    expect(() => zStorefrontFacets.parse(demoFacets)).not.toThrow();
  });

  it('id значений свойств не повторяются (рост 128 и размер обуви 28 не должны совпасть)', () => {
    const ids = demoFacets.attributes.flatMap((attribute) => attribute.values.map((value) => value.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('14 товаров, у каждого есть фото и хотя бы один вариант', () => {
    expect(demoProducts).toHaveLength(14);
    demoProducts.forEach((product) => {
      expect(product.photos.length).toBeGreaterThan(0);
      expect(product.variants.length).toBeGreaterThan(0);
    });
  });
});
