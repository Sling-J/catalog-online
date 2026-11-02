import { useLoadMore } from '@catalog/ui';
import { Plural } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';

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
  const cards = data.pages.flatMap((page) => page.items);

  return (
    <section className="mx-auto max-w-[1240px]">
      {/* на компьютере число товаров и сортировка стоят в строке категорий */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5 lg:hidden">
        <p className="text-caption text-ink-quiet">
          <Plural value={facets.total} one="# товар" few="# товара" many="# товаров" other="# товара" />
        </p>
        <CatalogSort value={params.sort ?? 'new'} onChange={onSortChange} />
      </div>
      {cards.length === 0 ? (
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
          {cards.map((card) => (
            <li key={card.id}>
              <ProductTile card={card} />
            </li>
          ))}
        </ul>
      )}
      {hasNextPage && <div ref={marker} aria-hidden="true" className="h-px" />}
    </section>
  );
}
