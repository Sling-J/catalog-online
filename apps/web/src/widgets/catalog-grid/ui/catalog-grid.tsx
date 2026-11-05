import { useLoadMore } from '@catalog/ui';
import { Plural } from '@lingui/react/macro';
import { hashKey, useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { productFacetsQueryOptions, productsQueryOptions, ProductTile } from '@/entities/product';
import type { ProductListParams, ProductSort } from '@/entities/product';
import { CatalogSort } from '@/features/catalog-sort';

import { EmptyState } from './empty-state';

/** Строка «N товаров · сортировка» и сетка: 3 колонки на телефоне, 5 на компьютере; страницы подгружаются при прокрутке. */
export function CatalogGrid({
  subdomain,
  params,
  onSortChange,
  hasFilters,
  onResetQuery,
  onResetFilters,
  onShowAllCategories,
}: {
  subdomain: string;
  params: ProductListParams;
  onSortChange: (sort: ProductSort) => void;
  /** Включены ли поиск или фильтры — от этого зависит текст пустой выборки. */
  hasFilters: boolean;
  onResetQuery: () => void;
  onResetFilters: () => void;
  /** Снять категорию, оставив фильтры («Все N →» в подборке из других категорий). */
  onShowAllCategories: () => void;
}) {
  const { data: facets } = useSuspenseQuery(productFacetsQueryOptions(subdomain, params));
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useSuspenseInfiniteQuery(
    productsQueryOptions(subdomain, params),
  );
  const marker = useLoadMore(
    () => {
      if (!isFetchingNextPage) void fetchNextPage();
    },
    hasNextPage,
    data.pages.length,
  );

  // Сколько страниц было при показе этой выборки: их плитки стоят сразу, следующие проявляются по очереди.
  // Смена выборки (фильтры, категория) снова считает показанными все её страницы.
  const queryKey = hashKey(productsQueryOptions(subdomain, params).queryKey);
  const [shown, setShown] = useState({ queryKey, pages: data.pages.length });
  if (shown.queryKey !== queryKey) setShown({ queryKey, pages: data.pages.length });
  const shownPages = shown.queryKey === queryKey ? shown.pages : data.pages.length;

  return (
    <section className="mx-auto max-w-[1240px]">
      {/* на компьютере число товаров и сортировка стоят в строке категорий */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 lg:hidden">
        <p className="text-caption text-ink-quiet">
          <Plural value={facets.total} one="# товар" few="# товара" many="# товаров" other="# товара" />
        </p>
        <CatalogSort value={params.sort ?? 'new'} onChange={onSortChange} />
      </div>
      {data.pages[0]?.items.length === 0 ? (
        <EmptyState
          subdomain={subdomain}
          params={params}
          hasFilters={hasFilters}
          onResetQuery={onResetQuery}
          onResetFilters={onResetFilters}
          onShowAllCategories={onShowAllCategories}
        />
      ) : (
        <ul className="grid grid-cols-3 gap-0.5 lg:grid-cols-5 lg:gap-2 lg:px-5">
          {data.pages.map((page, pageIndex) =>
            page.items.map((card, index) => {
              const loaded = pageIndex >= shownPages;
              return (
                <li
                  key={card.id}
                  className={loaded ? 'motion-safe:animate-tile-in' : undefined}
                  style={loaded ? { animationDelay: `${index * 30}ms` } : undefined}
                >
                  <ProductTile card={card} />
                </li>
              );
            }),
          )}
        </ul>
      )}
      {hasNextPage && <div ref={marker} aria-hidden="true" className="h-px" />}
    </section>
  );
}
