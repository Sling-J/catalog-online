import { createFileRoute, notFound } from '@tanstack/react-router';

import { attributesQueryOptions } from '@/entities/attribute';
import { categoriesQueryOptions } from '@/entities/category';
import { productQueryOptions } from '@/entities/product';
import { ProductPage } from '@/pages/product';
import { statusOf } from '@/shared/api';

// Карточка товара — вложенный экран (на телефоне без шапки и меню, T-306). Нет товара — «Не найдено».
export const Route = createFileRoute('/_shell/products_/$productId')({
  staticData: { subScreen: true },
  loader: async ({ context: { queryClient }, params }) => {
    try {
      await Promise.all([
        queryClient.ensureQueryData(productQueryOptions(params.productId)),
        queryClient.ensureQueryData(categoriesQueryOptions()),
        queryClient.ensureQueryData(attributesQueryOptions()),
      ]);
    } catch (error) {
      if (statusOf(error) === 404) throw notFound();
      throw error;
    }
  },
  component: function ProductRoute() {
    const { productId } = Route.useParams();
    // ключ — товар: при переходе на другой товар черновик начинается заново
    return <ProductPage key={productId} productId={productId} />;
  },
});
