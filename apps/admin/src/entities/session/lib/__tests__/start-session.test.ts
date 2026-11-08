import type * as Contract from '@catalog/contract';
import type { Me } from '@catalog/contract';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { meQueryOptions } from '@/entities/session/api';

import { startSession } from '../start-session';

const getMe = vi.hoisted(() => vi.fn());
vi.mock('@catalog/contract', async (importActual) => ({
  ...(await importActual<typeof Contract>()),
  getMe,
}));

const me = (setupCompleted: boolean) =>
  ({ account: { email: 'a@b.kz', emailVerified: false }, shop: { setupCompleted } }) as unknown as Me;

describe('startSession', () => {
  beforeEach(() => getMe.mockReset());

  it('кладёт аккаунт в кеш и стирает прошлую сессию', () => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(['products'], ['чужой товар']);
    startSession(queryClient, me(false));
    expect(queryClient.getQueryData(meQueryOptions().queryKey)).toEqual(me(false));
    expect(queryClient.getQueryData(['products'])).toBeUndefined();
  });

  // UX-аудит, E1: после регистрации конец мастера возвращал в мастер — `me` не перечитывался
  it('после invalidate `me` перечитывается с сервера, а не остаётся из входа', async () => {
    const queryClient = new QueryClient();
    startSession(queryClient, me(false));
    getMe.mockResolvedValue({ data: me(true) });

    // так перечитывает `me` сохранение магазина (applyShop): без подписчиков, refetchType 'all'
    await queryClient.invalidateQueries({ queryKey: meQueryOptions().queryKey, refetchType: 'all' });

    expect(getMe).toHaveBeenCalledOnce();
    const fresh = await queryClient.ensureQueryData(meQueryOptions());
    expect(fresh.shop.setupCompleted).toBe(true);
  });
});
