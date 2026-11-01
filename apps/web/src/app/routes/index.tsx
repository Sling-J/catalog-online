import { createFileRoute } from '@tanstack/react-router';

import { validateCatalogSearch } from '@/entities/product';
import { useTrackView } from '@/features/track-view';
import { CatalogPage, loadCatalog } from '@/pages/catalog';
import { LandingPage } from '@/pages/landing';
import { NOINDEX_HEAD } from '@/shared/lib';

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { tenant, queryClient, i18n } = context;
    return { head: tenant.kind === 'shop' ? await loadCatalog(queryClient, tenant.subdomain, deps, i18n) : undefined };
  },
  // нет данных — загрузчик не дошёл до конца (магазина нет, каталог скрыт): такие страницы не индексируем
  head: ({ loaderData }) => (loaderData ? (loaderData.head ?? {}) : NOINDEX_HEAD),
  component: Home,
});

// Один и тот же адрес `/`: на основном домене — лендинг, на поддомене магазина — каталог.
function Home() {
  const { tenant } = Route.useRouteContext();
  if (tenant.kind !== 'shop') return <LandingPage />;
  return <ShopCatalog subdomain={tenant.subdomain} />;
}

function ShopCatalog({ subdomain }: { subdomain: string }) {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  useTrackView(subdomain);
  return (
    <CatalogPage
      subdomain={subdomain}
      search={search}
      onSearchChange={(update, options) => void navigate({ search: (prev) => update(prev), replace: options?.replace })}
    />
  );
}
