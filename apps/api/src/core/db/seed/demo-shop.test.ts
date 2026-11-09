import { describe, expect, it } from 'vitest';

import { buildDemoRows } from './demo-shop.js';

describe('buildDemoRows', () => {
  const rows = buildDemoRows('hash', Date.parse('2026-11-09T12:00:00Z'));

  it('ссылки между строками сходятся', () => {
    const products = new Set(rows.products.map((row) => row.id));
    const variants = new Set(rows.variants.map((row) => row.id));
    const values = new Set(rows.attributeValues.map((row) => row.id));
    const categories = new Set(rows.categories.map((row) => row.id));
    expect(rows.variants.every((row) => products.has(row.productId))).toBe(true);
    expect(rows.variantValues.every((row) => variants.has(row.variantId) && values.has(row.attributeValueId))).toBe(
      true,
    );
    expect(rows.productPhotos.every((row) => products.has(row.productId))).toBe(true);
    expect(rows.products.every((row) => !row.categoryId || categories.has(row.categoryId))).toBe(true);
  });

  it('денормализованные цена и остаток совпадают с вариантами', () => {
    for (const product of rows.products) {
      const own = rows.variants.filter((variant) => variant.productId === product.id);
      expect(product.minPrice).toBe(Math.min(...own.map((variant) => variant.price)));
      expect(product.maxPrice).toBe(Math.max(...own.map((variant) => variant.price)));
      expect(product.totalStock).toBe(own.reduce((sum, variant) => sum + (variant.stock ?? 0), 0));
    }
  });

  it('артикулы и короткие id уникальны', () => {
    expect(new Set(rows.variants.map((row) => row.sku)).size).toBe(rows.variants.length);
    expect(new Set(rows.products.map((row) => row.shortId)).size).toBe(rows.products.length);
  });

  it('статистика: последний день — сегодня, неделя — числа из макета', () => {
    const shopDays = rows.dailyStats.filter((row) => row.productId === null);
    expect(shopDays.at(-1)!.date).toBe('2026-11-09');
    const week = shopDays.slice(-7).reduce((sum, row) => sum + (row.views ?? 0), 0);
    expect(week).toBe(1240);
  });
});
