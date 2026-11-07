import { createFileRoute } from '@tanstack/react-router';

import { ShopSoonPage } from '@/pages/shop-soon';

// «Магазин → Как показывать наличие» — экран появится в T-312; пока заглушка, чтобы строка раздела куда-то вела.
export const Route = createFileRoute('/_shell/shop_/stock')({
  staticData: { subScreen: true },
  component: () => <ShopSoonPage section="stock" />,
});
