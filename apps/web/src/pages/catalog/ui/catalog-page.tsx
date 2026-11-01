import { useSuspenseQuery } from '@tanstack/react-query';

import { shopQueryOptions } from '@/entities/shop';

// Заглушка: настоящий каталог — T-103…T-105.
export function CatalogPage({ subdomain }: { subdomain: string }) {
  const { data: shop } = useSuspenseQuery(shopQueryOptions(subdomain));
  return (
    <main className="p-4">
      <h1 className="text-xl font-semibold">{shop.name}</h1>
    </main>
  );
}
