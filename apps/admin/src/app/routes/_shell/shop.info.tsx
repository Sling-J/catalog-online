import { createFileRoute } from '@tanstack/react-router';

import { ShopInfoPage } from '@/pages/shop-info';

// «Магазин → О магазине» (T-310). Вложенный экран: на телефоне без шапки магазина и нижнего меню.
export const Route = createFileRoute('/_shell/shop/info')({
  staticData: { subScreen: true },
  component: ShopInfoPage,
});
