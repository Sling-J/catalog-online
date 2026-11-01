import { createFileRoute, notFound } from '@tanstack/react-router';
import { Suspense } from 'react';

import { validateCatalogSearch } from '@/entities/product';
import { CatalogPage } from '@/pages/catalog';
import { loadProduct, ProductPage } from '@/pages/product';
import { useIsDesktop } from '@/shared/hooks';

// Адрес товара: `/<slug>-<shortId>`. Товары есть только у магазина, на основном домене — «не найден».
// В адресе едет и выбор каталога (`?category=…`), чтобы под окном товара на компьютере был тот же каталог.
export const Route = createFileRoute('/$product')({
  validateSearch: validateCatalogSearch,
  loader: async ({ context, params }) => {
    const { tenant, queryClient } = context;
    if (tenant.kind !== 'shop') throw notFound();
    return { shortId: await loadProduct(queryClient, tenant.subdomain, params.product) };
  },
  component: Product,
});

function Product() {
  const { tenant } = Route.useRouteContext();
  const { shortId } = Route.useLoaderData();
  const search = Route.useSearch();
  const desktop = useIsDesktop();
  // loader уже отсёк чужие адреса, но тип контекста этого не знает
  if (tenant.kind !== 'shop') return null;
  return (
    <>
      {/* на компьютере под окном товара виден каталог; он дозагружается после гидратации и неактивен,
          пока открыто окно. Пока грузится — фон пустой, окно уже на месте */}
      {desktop && (
        <div inert aria-hidden="true">
          <Suspense fallback={null}>
            <CatalogPage subdomain={tenant.subdomain} search={search} onSearchChange={() => {}} />
          </Suspense>
        </div>
      )}
      <ProductPage subdomain={tenant.subdomain} shortId={shortId} search={search} />
    </>
  );
}
