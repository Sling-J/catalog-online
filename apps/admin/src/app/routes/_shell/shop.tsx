import { createFileRoute } from '@tanstack/react-router';

import { ShopPage } from '@/pages/shop';

export const Route = createFileRoute('/_shell/shop')({
  component: ShopPage,
});
