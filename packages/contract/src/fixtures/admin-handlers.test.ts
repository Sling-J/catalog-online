import { setupServer } from 'msw/node';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import type { Me, Shop } from '../gen/types.gen.js';
import { demoAdminHandlers } from './admin-handlers.js';
import { createDemoShopData } from './demo-shop.js';

const server = setupServer(...demoAdminHandlers());
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

const getJson = async <T>(path: string): Promise<T> => (await fetch(`http://api.test/v1${path}`)).json() as Promise<T>;

describe('моки админки', () => {
  it('владелец демо-магазина вошёл и прошёл мастер', async () => {
    const me = await getJson<Me>('/auth/me');
    expect(me.shop).toMatchObject({ subdomain: 'aigerim-kids', status: 'published', setupCompleted: true });
  });

  it('счётчики товаров совпадают с чек-листом магазина', async () => {
    const [shop, counts] = await Promise.all([
      getJson<Shop>('/admin/shop'),
      getJson<{ all: number; noPhoto: number }>('/admin/products/counts'),
    ]);
    expect(counts.all).toBe(createDemoShopData().products.length);
    expect(shop.readiness).toMatchObject({ productCount: counts.all, productsWithoutPhoto: counts.noPhoto });
  });
});
