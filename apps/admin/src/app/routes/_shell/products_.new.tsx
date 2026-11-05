import { createFileRoute } from '@tanstack/react-router';

import { attributesQueryOptions } from '@/entities/attribute';
import { categoriesQueryOptions } from '@/entities/category';
import { NewProductPage } from '@/pages/new-product';

// Новый товар вручную — вложенный экран (на телефоне без шапки и меню, T-306).
export const Route = createFileRoute('/_shell/products_/new')({
  staticData: { subScreen: true },
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(attributesQueryOptions()),
    ]),
  component: NewProductPage,
});
