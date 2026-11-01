import { useSuspenseQuery } from '@tanstack/react-query';

import { shopQueryOptions } from '@/entities/shop';
import { DEMO_SUBDOMAIN } from '@/shared/constants/demo';

// Заглушка: настоящий каталог — T-103…T-105.
export function CatalogPage() {
  const { data: shop } = useSuspenseQuery(shopQueryOptions(DEMO_SUBDOMAIN));
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">{shop.name}</h1>
    </main>
  );
}
