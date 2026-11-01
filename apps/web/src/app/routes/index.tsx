import { createFileRoute } from '@tanstack/react-router';

import { validateCatalogSearch } from '@/entities/product';
import { useTrackView } from '@/features/track-view';
import { CatalogPage, loadCatalog } from '@/pages/catalog';
import { LandingPage, landingHead } from '@/pages/landing';
import { getSiteOrigin, NOINDEX_HEAD, serviceUrls } from '@/shared/lib';

export const Route = createFileRoute('/')({
  validateSearch: validateCatalogSearch,
  loaderDeps: ({ search }) => search,
  loader: async ({ context, deps }) => {
    const { tenant, queryClient, i18n } = context;
    if (tenant.kind === 'shop') return { head: await loadCatalog(queryClient, tenant.subdomain, deps, i18n) };
    const origin = getSiteOrigin();
    return { head: landingHead({ i18n, origin }), urls: serviceUrls(origin) };
  },
  // нет данных — загрузчик не дошёл до конца (магазина нет, каталог скрыт): такие страницы не индексируем
  head: ({ loaderData }) => loaderData?.head ?? NOINDEX_HEAD,
  component: Home,
});

// Один и тот же адрес `/`: на основном домене — лендинг, на поддомене магазина — каталог.
function Home() {
  const { tenant } = Route.useRouteContext();
  const data = Route.useLoaderData();
  if (tenant.kind !== 'shop') {
    // адреса регистрации и демо-магазина посчитал загрузчик (они же нужны серверу для разметки)
    const urls = ('urls' in data ? data.urls : undefined) ?? serviceUrls(getSiteOrigin());
    return <LandingPage registerUrl={urls.register} demoShopUrl={urls.demoShop} />;
  }
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
