import { createFileRoute } from '@tanstack/react-router';

import { shopQueryOptions } from '@/entities/shop';
import { CatalogPage } from '@/pages/catalog';
import { DEMO_SUBDOMAIN } from '@/shared/constants/demo';

export const Route = createFileRoute('/')({
  loader: ({ context }) => context.queryClient.ensureQueryData(shopQueryOptions(DEMO_SUBDOMAIN)),
  component: CatalogPage,
});
