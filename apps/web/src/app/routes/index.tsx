import { createFileRoute } from '@tanstack/react-router';

import { validateCatalogSearch } from '@/entities/product';
import { CatalogPage, loadCatalog } from '@/pages/catalog';
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
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  if (tenant.kind !== 'shop') return <LandingPage />;
  return (
    <CatalogPage
      subdomain={tenant.subdomain}
      search={search}
      onSearchChange={(update, options) => void navigate({ search: (prev) => update(prev), replace: options?.replace })}
    />
  );
}
