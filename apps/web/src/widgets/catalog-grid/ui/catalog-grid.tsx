import { Button } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { useSuspenseInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';

import { productFacetsQueryOptions, productsQueryOptions, ProductTile } from '@/entities/product';
import type { ProductListParams, ProductSort } from '@/entities/product';
import { CatalogSort } from '@/features/catalog-sort';

import { useLoadMore } from '../hooks';

/** Строка «N товаров · сортировка» и сетка: 3 колонки на телефоне, 5 на компьютере; страницы подгружаются при прокрутке. */
export function CatalogGrid({
  subdomain,
  params,
  onSortChange,
  hasFilters,
  onResetFilters,
}: {
  subdomain: string;
  params: ProductListParams;
  onSortChange: (sort: ProductSort) => void;
  /** Включены ли поиск или фильтры — от этого зависит текст пустой выборки. */
  hasFilters: boolean;
  onResetFilters: () => void;
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
      <div className="flex items-center justify-between px-4 pt-3 pb-2.5">
        <p className="text-caption text-ink-quiet">
          <Plural value={facets.total} one="# товар" few="# товара" many="# товаров" other="# товара" />
        </p>
        <CatalogSort value={params.sort ?? 'new'} onChange={onSortChange} />
      </div>
      {cards.length === 0 ? (
        <EmptyState filtered={hasFilters} onReset={onResetFilters} />
      ) : (
        <ul className="grid grid-cols-3 gap-0.5 lg:grid-cols-5 lg:gap-2 lg:px-4">
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

function EmptyState({ filtered, onReset }: { filtered: boolean; onReset: () => void }) {
  return (
    <div className="px-6 py-16 text-center">
      {filtered ? (
        <>
          <p className="text-[18px] font-extrabold">
            <Trans>Ничего не нашлось</Trans>
          </p>
          <p className="mt-1.5 text-[14px] text-ink-quiet">
            <Trans>Попробуйте другой запрос или уберите фильтры</Trans>
          </p>
          <Button className="mt-4" onClick={onReset}>
            <Trans>Сбросить поиск и фильтры</Trans>
          </Button>
        </>
      ) : (
        <p className="text-[15px] text-ink-quiet">
          <Trans>Здесь пока нет товаров</Trans>
        </p>
      )}
    </div>
  );
}
