import { setupServer } from 'msw/node';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { StorefrontFacets, StorefrontProductCard } from '../gen/types.gen.js';
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
