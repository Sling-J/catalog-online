import { createFileRoute } from '@tanstack/react-router';

import { ShopAccountPage } from '@/pages/shop-account';

// «Магазин → Вход и пароль». Вложенный экран: на телефоне без шапки магазина и нижнего меню (staticData.subScreen).
export const Route = createFileRoute('/_shell/shop_/account')({
  staticData: { subScreen: true },
  component: ShopAccountPage,
});
