import { createFileRoute, Outlet } from '@tanstack/react-router';

import { productCountsQueryOptions } from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { AppShell } from '@/widgets/app-shell';

// Рабочие разделы внутри меню и шапки магазина (A1). Вход и мастер (T-302, T-303) — вне этого макета.
export const Route = createFileRoute('/_shell')({
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
