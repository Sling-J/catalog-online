import { cx, useIsDesktop, useLoadMore } from '@catalog/ui';
import { keepPreviousData, useInfiniteQuery } from '@tanstack/react-query';

import { type ProductListParams, type ProductSort, productsQueryOptions } from '@/entities/product';

import { ListSkeleton } from './list-skeleton';
import { ListState } from './list-state';
import { ProductRow } from './product-row';
import { ProductTable } from './product-table';

/**
 * Товары выборки: список на телефоне (макет AdminPhone, экран 2), таблица с массовыми действиями на компьютере
 * (макет AdminDesk, экран 1). Следующие страницы подгружаются при прокрутке. Загрузка, ошибка, «Ничего не нашлось»
 * и пустая вкладка — по доске AdminProductsStates. Выбор держит страница: на телефоне он меняет её шапку и меню.
 */
export function ProductList({
  params,
  lowStockThreshold,
  selected,
  onToggle,
  onClear,
  onDone,
  onResetSearch,
  onSortChange,
}: {
  params: ProductListParams;
  lowStockThreshold: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  /** Массовое действие выполнено — текст сообщения. */
  onDone: (message: string) => void;
  onResetSearch: () => void;
  /** Порядок меняют заголовки таблицы на компьютере; на телефоне — шторка страницы. */
  onSortChange: (sort: ProductSort | undefined) => void;
}) {
  const isDesktop = useIsDesktop();
  // пока грузится новая выборка (поиск, вкладка), видна прежняя
  const { data, isPending, isError, refetch, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery({
    ...productsQueryOptions(params),
    placeholderData: keepPreviousData,
  });
  const pages = data?.pages ?? [];
  const products = pages.flatMap((page) => page.items);
  const marker = useLoadMore(() => !isFetchingNextPage && void fetchNextPage(), hasNextPage, pages.length);
  const loading = isPending && !isError;
  const state =
    !loading && products.length === 0 ? (
      <ListState
        params={params}
        failed={isError}
        onRetry={() => void refetch()}
        onResetSearch={onResetSearch}
        className={isDesktop ? undefined : 'px-2 pt-12'}
      />
    ) : null;

  const loadMore = <div ref={marker} aria-hidden="true" />;
  if (isDesktop) {
    return (
      <ProductTable
        products={products}
        total={pages[0]?.total ?? 0}
        hasMore={hasNextPage}
        loading={loading}
        placeholder={state}
        lowStockThreshold={lowStockThreshold}
        selected={selected}
        onToggle={onToggle}
        onClear={onClear}
        onDone={onDone}
        sort={params.sort}
        onSortChange={onSortChange}
      >
        {loadMore}
      </ProductTable>
    );
  }
  if (loading) return <ListSkeleton />;
  if (state) return state;
  const selecting = selected.size > 0;
  return (
    <>
      {/* в режиме выбора строки во всю ширину, с квадратом слева (доска AdminProductsStates, экран 1) */}
      <ul className={cx('pt-1', selecting && '-mx-4 mt-2.5')}>
        {products.map((product) => (
          <ProductRow
            key={product.id}
            product={product}
            lowStockThreshold={lowStockThreshold}
            selecting={selecting}
            selected={selected.has(product.id)}
            onToggle={() => onToggle(product.id)}
          />
        ))}
      </ul>
      {loadMore}
    </>
  );
}
