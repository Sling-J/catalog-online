import { createFileRoute } from '@tanstack/react-router';

import { ShopSoonPage } from '@/pages/shop-soon';

// «Магазин → Категории и размеры» — экран появится в T-311; пока заглушка, чтобы строка раздела куда-то вела.
export const Route = createFileRoute('/_shell/shop_/categories')({
  staticData: { subScreen: true },
  component: () => <ShopSoonPage section="categories" />,
});
