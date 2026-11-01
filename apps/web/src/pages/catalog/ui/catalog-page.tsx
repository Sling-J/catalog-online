import { Plural } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Suspense, useState } from 'react';

import { categoriesQueryOptions } from '@/entities/category';
import {
  productFacetsQueryOptions,
  selectedValues,
  toProductParams,
  type CatalogSearch,
  type ProductSort,
} from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { CatalogSort } from '@/features/catalog-sort';
import { ProductSearch } from '@/features/product-search';
import {
  ActiveFilters,
  countActiveFilters,
  FiltersButton,
  FiltersPanel,
  FiltersSheet,
  FiltersToggle,
  type FilterState,
} from '@/features/product-filters';
import { AboutShopSheet } from '@/widgets/about-shop-sheet';
import { CartButton, CartPill } from '@/widgets/cart-pill';
import { CatalogGrid, GridSkeleton } from '@/widgets/catalog-grid';
import { CategoryBar } from '@/widgets/category-bar';
import { ShopHeader } from '@/widgets/shop-header';

/** Как страница меняет адрес: строит новый выбор из прежнего; `replace` — не плодить записи истории. */
export type SearchChange = (update: (prev: CatalogSearch) => CatalogSearch, options?: { replace?: boolean }) => void;

/**
 * Каталог. Выбор (категория, сортировка, поиск, фильтры) приходит из адреса маршрута и меняется через
 * `onSearchChange`: так одну и ту же страницу можно показать и на `/`, и под окном товара на компьютере.
 */
export function CatalogPage({
  subdomain,
  search,
  onSearchChange,
}: {
  subdomain: string;
  search: CatalogSearch;
  onSearchChange: SearchChange;
}) {
  const params = toProductParams(search);

  const { data: shop } = useSuspenseQuery(shopQueryOptions(subdomain));
  const { data: categories } = useSuspenseQuery(categoriesQueryOptions(subdomain));
  const { data: facets } = useSuspenseQuery(productFacetsQueryOptions(subdomain, params));
  // весь магазин без фильтров — чтобы подписать выбранные значения, даже если в выборке их уже нет
  const { data: allFacets } = useSuspenseQuery(productFacetsQueryOptions(subdomain));

  const [aboutOpen, setAboutOpen] = useState(false);
  // телефон: фильтры шторкой; компьютер: панель поверх сетки под категориями
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const filters: FilterState = { values: selectedValues(search), priceMin: search.priceMin, priceMax: search.priceMax };
  const hasFilters = countActiveFilters(filters) > 0 || !!search.q;

  // выбор живёт в адресе (FR-V4): ссылкой можно поделиться, «назад» возвращает прежний выбор;
  // поиск и фильтры меняются на ходу, поэтому пишем их поверх текущей записи, а не новой
  const selectCategory = (category: string | undefined) => onSearchChange((prev) => ({ ...prev, category }));
  const changeSort = (sort: ProductSort) =>
    onSearchChange((prev) => ({ ...prev, sort: sort === 'new' ? undefined : sort }));
  const changeQuery = (q: string) => onSearchChange((prev) => ({ ...prev, q: q || undefined }), { replace: true });
  const changeFilters = (next: FilterState) =>
    onSearchChange(
      (prev) => ({
        ...prev,
        values: next.values.length > 0 ? next.values.join(',') : undefined,
        priceMin: next.priceMin,
        priceMax: next.priceMax,
      }),
      { replace: true },
    );
  const resetAll = () =>
    onSearchChange((prev) => ({ ...prev, q: undefined, values: undefined, priceMin: undefined, priceMax: undefined }), {
      replace: true,
    });
  const resetFilters = () => changeFilters({ values: [] });

  return (
    <div className="min-h-dvh bg-paper pb-28 font-sans text-ink-night lg:pb-10">
      <ShopHeader
        shop={shop}
        onOpenAbout={() => setAboutOpen(true)}
        search={
          <div className="flex gap-2">
            <ProductSearch value={search.q ?? ''} onChange={changeQuery} />
            <div className="lg:hidden">
              <FiltersButton count={countActiveFilters(filters)} onClick={() => setFiltersOpen(true)} />
            </div>
          </div>
        }
        actions={<CartButton subdomain={subdomain} />}
      >
        <CategoryBar
          categories={categories}
          selectedId={search.category}
          onSelect={selectCategory}
          trailing={
            <>
              <p className="mr-2 text-[14px] text-ink-quiet">
                <Plural value={facets.total} one="# товар" few="# товара" many="# товаров" other="# товара" />
              </p>
              <FiltersToggle
                count={countActiveFilters(filters)}
                expanded={panelOpen}
                onClick={() => setPanelOpen((open) => !open)}
              />
              <CatalogSort pill value={params.sort ?? 'new'} onChange={changeSort} />
            </>
          }
        />
        <ActiveFilters all={allFacets} state={filters} onChange={changeFilters} />
      </ShopHeader>
      {/* панель фильтров компьютера ложится поверх сетки, не сдвигая её */}
      <main className="relative">
        <FiltersPanel
          open={panelOpen}
          onClose={() => setPanelOpen(false)}
          all={allFacets}
          current={facets}
          state={filters}
          onChange={changeFilters}
          onReset={resetFilters}
        />
        {/* шапка и категории на месте сразу, сетка мерцает, пока грузится выборка */}
        <Suspense fallback={<GridSkeleton />}>
          <CatalogGrid
            subdomain={subdomain}
            params={params}
            onSortChange={changeSort}
            hasFilters={hasFilters}
            onResetQuery={() => changeQuery('')}
            onResetFilters={resetAll}
            onShowAllCategories={() => selectCategory(undefined)}
          />
        </Suspense>
      </main>
      <CartPill subdomain={subdomain} />
      <AboutShopSheet shop={shop} open={aboutOpen} onClose={() => setAboutOpen(false)} />
      <FiltersSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        all={allFacets}
        current={facets}
        state={filters}
        onChange={changeFilters}
        onReset={resetFilters}
      />
    </div>
  );
}
