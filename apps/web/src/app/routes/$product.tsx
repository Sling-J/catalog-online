import { createFileRoute, notFound } from '@tanstack/react-router';

import { loadProduct, ProductPage } from '@/pages/product';

// Адрес товара: `/<slug>-<shortId>`. Товары есть только у магазина, на основном домене — «не найден».
export const Route = createFileRoute('/$product')({
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
  // loader уже отсёк чужие адреса, но тип контекста этого не знает
  return tenant.kind === 'shop' ? <ProductPage subdomain={tenant.subdomain} shortId={shortId} /> : null;
}
