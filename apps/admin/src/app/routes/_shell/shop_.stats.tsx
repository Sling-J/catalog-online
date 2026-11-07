import { createFileRoute } from '@tanstack/react-router';

import { ShopSoonPage } from '@/pages/shop-soon';

// «Магазин → Статистика» — экран появится в T-313; пока заглушка, чтобы строка раздела куда-то вела.
export const Route = createFileRoute('/_shell/shop_/stats')({
  staticData: { subScreen: true },
  component: () => <ShopSoonPage section="stats" />,
});
