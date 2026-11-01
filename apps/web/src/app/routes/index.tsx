import { createFileRoute } from '@tanstack/react-router';

import { CatalogPage, loadCatalog, validateCatalogSearch } from '@/pages/catalog';
import { LandingPage } from '@/pages/landing';

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { tenant, queryClient } = context;
    if (tenant.kind === 'shop') await loadCatalog(queryClient, tenant.subdomain, deps);
  },
  component: Home,
});

// Один и тот же адрес `/`: на основном домене — лендинг, на поддомене магазина — каталог.
function Home() {
  const { tenant } = Route.useRouteContext();
  return tenant.kind === 'shop' ? <CatalogPage subdomain={tenant.subdomain} /> : <LandingPage />;
}
