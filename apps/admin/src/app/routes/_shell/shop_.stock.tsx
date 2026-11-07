import { createFileRoute } from '@tanstack/react-router';

import { shopQueryOptions } from '@/entities/shop';
import { ShopStockPage } from '@/pages/shop-stock';

// «Магазин → Наличие на витрине» (T-312). Вложенный экран: на телефоне без шапки магазина и нижнего меню.
export const Route = createFileRoute('/_shell/shop_/stock')({
  staticData: { subScreen: true },
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(shopQueryOptions()),
  component: ShopStockPage,
});
