import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { shopQueryOptions } from '@/entities/shop';
import { AboutShopSheet } from '@/widgets/about-shop-sheet';
import { ShopHeader } from '@/widgets/shop-header';

// Витрина собирается по шагам: шапка и «О магазине» — T-103, сетка и категории — T-104, поиск и фильтры — T-105.
export function CatalogPage({ subdomain }: { subdomain: string }) {
  const { data: shop } = useSuspenseQuery(shopQueryOptions(subdomain));
  const [aboutOpen, setAboutOpen] = useState(false);

  return (
    <div className="min-h-dvh bg-paper font-sans text-ink-night">
      <ShopHeader shop={shop} onOpenAbout={() => setAboutOpen(true)} />
      <main />
      <AboutShopSheet shop={shop} open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
