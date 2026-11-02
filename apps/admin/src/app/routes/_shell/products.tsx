import { createFileRoute } from '@tanstack/react-router';

import { categoriesQueryOptions } from '@/entities/category';
import { productsQueryOptions } from '@/entities/product';
import { ProductsPage, toListParams, validateProductsSearch } from '@/pages/products';

// «Товары» (FR-A5): поиск, вкладка и категория — в адресе. Список не ждём: пока грузится, видна загрузка,
// не загрузился — экран ошибки внутри раздела (доска AdminProductsStates).
export const Route = createFileRoute('/_shell/products')({
  validateSearch: validateProductsSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchInfiniteQuery(productsQueryOptions(toListParams(deps)));
    return queryClient.ensureQueryData(categoriesQueryOptions());
  },
  component: function ProductsRoute() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return <ProductsPage search={search} onSearchChange={(next) => navigate({ search: next, replace: true })} />;
  },
});
