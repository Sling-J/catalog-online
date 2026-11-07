import { createFileRoute } from '@tanstack/react-router';

import { attributesQueryOptions } from '@/entities/attribute';
import { categoriesQueryOptions } from '@/entities/category';
import { ShopCategoriesPage } from '@/pages/shop-categories';

// «Магазин → Категории и размеры» (T-311). Вложенный экран: на телефоне без шапки магазина и нижнего меню.
export const Route = createFileRoute('/_shell/shop_/categories')({
  staticData: { subScreen: true },
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(attributesQueryOptions()),
    ]),
  component: ShopCategoriesPage,
});
