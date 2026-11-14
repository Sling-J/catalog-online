import type { Me, Shop } from '@catalog/contract';
import { getMeQueryKey } from '@catalog/contract/query';
import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';

import { applyShop, shopQueryOptions } from '../shop.api';

const me: Me = {
  account: { id: 'a', email: 'a@shop.test', emailVerified: true, impersonated: false },
  shop: { id: 's', name: 'Старое', subdomain: 'old', status: 'draft', setupCompleted: false },
};
const shop = { id: 's', name: 'Новое', subdomain: 'new-shop', status: 'published' } as Shop;

describe('applyShop', () => {
  it('магазин и поля `me` — в кеш без запросов (e2e T-502: раньше `me` перечитывался после каждого сохранения)', () => {
    const queryClient = new QueryClient();
    const fetchMe = vi.fn();
    queryClient.setQueryDefaults(getMeQueryKey(), { queryFn: fetchMe });
    queryClient.setQueryData(getMeQueryKey(), me);

    applyShop(queryClient, shop);

    expect(queryClient.getQueryData(shopQueryOptions().queryKey)).toBe(shop);
    expect(queryClient.getQueryData<Me>(getMeQueryKey())?.shop).toEqual({
      id: 's',
      name: 'Новое',
      subdomain: 'new-shop',
      status: 'published',
      setupCompleted: false,
    });
    expect(fetchMe).not.toHaveBeenCalled();
  });

  it('«мастер пройден» — из того, что меняли', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(getMeQueryKey(), me);
    applyShop(queryClient, shop, { setupCompleted: true });
    expect(queryClient.getQueryData<Me>(getMeQueryKey())?.shop.setupCompleted).toBe(true);
  });

  it('без `me` в кеше — не создаёт его', () => {
    const queryClient = new QueryClient();
    applyShop(queryClient, shop);
    expect(queryClient.getQueryData(getMeQueryKey())).toBeUndefined();
  });
});
