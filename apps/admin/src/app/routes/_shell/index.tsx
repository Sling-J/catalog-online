import { createFileRoute, redirect } from '@tanstack/react-router';

import { shopQueryOptions } from '@/entities/shop';
import { HomePage } from '@/pages/home';

// Главная: до публикации — чек-лист (T-304), после — стартовый экран «Товары» (A2).
export const Route = createFileRoute('/_shell/')({
  loader: async ({ context: { queryClient } }) => {
    const shop = await queryClient.ensureQueryData(shopQueryOptions());
    if (shop.status !== 'draft') throw redirect({ to: '/products', replace: true });
  },
  component: HomePage,
});
