import { createFileRoute, notFound } from '@tanstack/react-router';

import { shopQueryOptions } from '@/entities/shop';
import { CatalogPage } from '@/pages/catalog';
import { LandingPage } from '@/pages/landing';
import { isNotFoundError } from '@/shared/api';

export const Route = createFileRoute('/')({
  loader: async ({ context }) => {
    const { tenant, queryClient } = context;
    if (tenant.kind !== 'shop') return;
    try {
      await queryClient.ensureQueryData(shopQueryOptions(tenant.subdomain));
    } catch (error) {
      if (isNotFoundError(error)) throw notFound();
      throw error;
    }
  },
  component: Home,
});

// Один и тот же адрес `/`: на основном домене — лендинг, на поддомене магазина — каталог.
function Home() {
  const { tenant } = Route.useRouteContext();
  return tenant.kind === 'shop' ? <CatalogPage subdomain={tenant.subdomain} /> : <LandingPage />;
}
