import { setupServer } from 'msw/node';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type {
  StorefrontFacets,
  StorefrontProduct,
  StorefrontProductCard,
  StorefrontShopGone,
} from '../gen/types.gen.js';
import { LOW_STOCK } from './demo-shop.js';
import { demoStorefrontHandlers } from './handlers.js';

const server = setupServer(...demoStorefrontHandlers({ assetBase: '' }));
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

const base = 'http://api.test/v1/storefront/aigerim-kids';
type Page = { items: StorefrontProductCard[]; nextCursor: string | null };
const getJson = async <T>(path: string): Promise<T> => (await fetch(`${base}${path}`)).json() as Promise<T>;

describe('моки витрины: список товаров', () => {
  it('режет на страницы по курсору и заканчивается null', async () => {
    const first = await getJson<Page>('/products?limit=6');
    expect(first.items).toHaveLength(6);
    expect(first.nextCursor).toBe('6');

    const second = await getJson<Page>(`/products?limit=6&cursor=${first.nextCursor}`);
    const third = await getJson<Page>(`/products?limit=6&cursor=${second.nextCursor}`);
    expect(third.items).toHaveLength(2);
    expect(third.nextCursor).toBeNull();

    const ids = [...first.items, ...second.items, ...third.items].map((card) => card.id);
    expect(new Set(ids).size).toBe(14);
  });

  it('сортирует по цене', async () => {
    const { items } = await getJson<Page>('/products?sort=price_asc');
    const prices = items.map((card) => card.price);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    const desc = await getJson<Page>('/products?sort=price_desc');
    expect(desc.items[0]?.price).toBe(Math.max(...prices));
  });

  it('фото — относительные адреса, если так попросили', async () => {
    const { items } = await getJson<Page>('/products?limit=1');
    expect(items[0]?.cover?.sizes[320]).toMatch(/^\/demo\//);
  });

  it('ищет по названию без учёта регистра', async () => {
    const { items } = await getJson<Page>('/products?q=ПЛАТЬЕ');
    expect(items.length).toBeGreaterThan(0);
    items.forEach((card) => expect(card.name.toLowerCase()).toContain('платье'));
  });

  it('фильтрует по цене', async () => {
    const { items } = await getJson<Page>('/products?priceMin=5000&priceMax=10000');
    expect(items.length).toBeGreaterThan(0);
    items.forEach((card) => {
      expect(card.price).toBeGreaterThanOrEqual(5000);
      expect(card.price).toBeLessThanOrEqual(10000);
    });
  });

  it('фильтрует по значениям свойств: внутри свойства ИЛИ', async () => {
    const facets = await getJson<StorefrontFacets>('/facets');
    const [first, second] = facets.attributes[0]!.values;
    const one = await getJson<Page>(`/products?values=${first!.id}`);
    const both = await getJson<Page>(`/products?values=${first!.id},${second!.id}`);
    expect(one.items.length).toBeGreaterThan(0);
    expect(one.items.length).toBeLessThan(14);
    expect(both.items.length).toBeGreaterThanOrEqual(one.items.length);
  });

  it('фасеты: значения свойства не пропадают после выбора этого свойства, цены считаются без фильтра по цене', async () => {
    const all = await getJson<StorefrontFacets>('/facets');
    const attribute = all.attributes[0]!;
    const picked = attribute.values[0]!;
    const filtered = await getJson<StorefrontFacets>(`/facets?values=${picked.id}&priceMin=9000`);
    expect(filtered.attributes.find((entry) => entry.id === attribute.id)?.values.length).toBeGreaterThan(1);
    expect(filtered.price.min).toBeLessThan(9000);
    expect(filtered.total).toBeLessThanOrEqual(all.total);
  });

  it('число товаров в фильтрах считается по выборке', async () => {
    const all = await getJson<StorefrontFacets>('/facets');
    expect(all.total).toBe(14);
    const { items } = await getJson<Page>('/products');
    const categories = await getJson<{ id: string }[]>('/categories');
    const first = categories[0]!;
    const filtered = await getJson<StorefrontFacets>(`/facets?categoryId=${first.id}`);
    expect(filtered.total).toBeLessThan(items.length);
    expect(filtered.total).toBeGreaterThan(0);
  });
});

describe('моки витрины: перепроверка корзины', () => {
  const check = async (items: { variantId: string; quantity: number }[]) => {
    const response = await fetch(`${base}/cart/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    });
    return response.json() as Promise<{
      items: { variantId: string; status: string; quantity: number; price: number | null }[];
    }>;
  };

  const firstVariantWith = async (level: 'in' | 'low' | 'out') => {
    const cards = (await getJson<Page>('/products')).items;
    for (const card of cards) {
      const product = await getJson<StorefrontProduct>(`/products/${card.shortId}`);
      const variant = product.variants.find((entry) => entry.stock.level === level);
      if (variant) return variant;
    }
    throw new Error(`в демо нет варианта с уровнем ${level}`);
  };

  it('в наличии — как есть', async () => {
    const variant = await firstVariantWith('in');
    const { items } = await check([{ variantId: variant.id, quantity: 5 }]);
    expect(items[0]).toMatchObject({ status: 'ok', quantity: 5, price: variant.price });
  });

  it('«мало» — количество не больше LOW_STOCK', async () => {
    const variant = await firstVariantWith('low');
    const { items } = await check([{ variantId: variant.id, quantity: 9 }]);
    expect(items[0]!.quantity).toBe(LOW_STOCK);
  });

  it('закончилось и неизвестный вариант', async () => {
    const out = await firstVariantWith('out');
    const { items } = await check([
      { variantId: out.id, quantity: 1 },
      { variantId: '0192d000-0000-7000-8000-00000000ffff', quantity: 1 },
    ]);
    expect(items[0]).toMatchObject({ status: 'out_of_stock', quantity: 0 });
    expect(items[1]).toMatchObject({ status: 'unavailable', quantity: 0 });
  });
});

describe('моки витрины: служебные состояния', () => {
  it('скрытый каталог — 410 с контактами магазина', async () => {
    const response = await fetch('http://api.test/v1/storefront/skrytyj-magazin');
    expect(response.status).toBe(410);
    const body = (await response.json()) as StorefrontShopGone;
    expect(body).toMatchObject({ status: 410, code: 'shop_hidden', shop: { name: 'Айгерим Kids' } });
    expect(body.shop.whatsapp).toMatch(/^\+7/);
  });

  it('превью открывает скрытый каталог и помечает магазин isPreview', async () => {
    const response = await fetch('http://api.test/v1/storefront/skrytyj-magazin?preview=demo');
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ subdomain: 'skrytyj-magazin', isPreview: true });
    const products = await fetch('http://api.test/v1/storefront/skrytyj-magazin/products?preview=demo');
    expect(products.status).toBe(200);
  });

  it('есть товар, раскупленный целиком — для экрана «Закончился»', async () => {
    const { items } = await getJson<Page>('/products');
    const soldOut = items.filter((card) => card.stockLevel === 'out');
    expect(soldOut).toHaveLength(1);
    const product = await getJson<StorefrontProduct>(`/products/${soldOut[0]!.shortId}`);
    expect(product.variants.every((variant) => variant.stock.level === 'out')).toBe(true);
  });
});
