import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useState } from 'react';

import { categoriesQueryOptions } from '@/entities/category';
import type { ProductSort } from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { AboutShopSheet } from '@/widgets/about-shop-sheet';
import { CatalogGrid } from '@/widgets/catalog-grid';
import { CategoryBar } from '@/widgets/category-bar';
import { ShopHeader } from '@/widgets/shop-header';

import { toProductParams } from '../lib';

// Витрина собирается по шагам: шапка и «О магазине» — T-103, категории, сетка, сортировка — T-104, поиск и фильтры — T-105.
export function CatalogPage({ subdomain }: { subdomain: string }) {
  const { data: shop } = useSuspenseQuery(shopQueryOptions(subdomain));
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions(subdomain));
  const search = useSearch({ from: '/' });
  const navigate = useNavigate({ from: '/' });
  const [aboutOpen, setAboutOpen] = useState(false);

  // выбор живёт в адресе (FR-V4): ссылкой можно поделиться, «назад» возвращает прежний выбор
  const selectCategory = (category: string | undefined) => void navigate({ search: (prev) => ({ ...prev, category }) });
  const changeSort = (sort: ProductSort) =>
    void navigate({ search: (prev) => ({ ...prev, sort: sort === 'new' ? undefined : sort }) });

  return (
    <div className="min-h-dvh bg-paper font-sans text-ink-night">
      <ShopHeader shop={shop} onOpenAbout={() => setAboutOpen(true)}>
        <CategoryBar categories={categories} selectedId={search.category} onSelect={selectCategory} />
      </ShopHeader>
      <main>
        <CatalogGrid subdomain={subdomain} params={toProductParams(search)} onSortChange={changeSort} />
      </main>
      <AboutShopSheet shop={shop} open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </div>
  );
}
