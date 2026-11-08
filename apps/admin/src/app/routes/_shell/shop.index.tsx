import { createFileRoute } from '@tanstack/react-router';

import { attributesQueryOptions } from '@/entities/attribute';
import { categoriesQueryOptions } from '@/entities/category';
import { ShopPage } from '@/pages/shop';

// Раздел «Магазин» (T-310): публикация и пункты настроек. В подписях строк — число категорий и свойства.
export const Route = createFileRoute('/_shell/shop/')({
  loader: ({ context: { queryClient } }) =>
    Promise.all([
      queryClient.ensureQueryData(categoriesQueryOptions()),
      queryClient.ensureQueryData(attributesQueryOptions()),
    ]),
  component: ShopPage,
});
