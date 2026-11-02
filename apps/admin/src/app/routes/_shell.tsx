import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

import { productCountsQueryOptions } from '@/entities/product';
import { meQueryOptions } from '@/entities/session';
import { shopQueryOptions } from '@/entities/shop';
import { isUnauthorized } from '@/shared/api';
import { AppShell } from '@/widgets/app-shell';

// Рабочие разделы внутри меню и шапки магазина (A1). Без сессии — на вход, мастер не пройден — в мастер (T-303).
export const Route = createFileRoute('/_shell')({
  beforeLoad: async ({ context: { queryClient } }) => {
    let setupCompleted: boolean;
    try {
      setupCompleted = (await queryClient.ensureQueryData(meQueryOptions())).shop.setupCompleted;
    } catch (error) {
      if (isUnauthorized(error)) throw redirect({ to: '/login', replace: true });
      throw error;
    }
    if (!setupCompleted) throw redirect({ to: '/setup', replace: true });
  },
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(shopQueryOptions()),
      queryClient.ensureQueryData(productCountsQueryOptions()),
    ]),
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
