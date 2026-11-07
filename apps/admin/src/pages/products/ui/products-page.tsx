import { Icon, useIsDesktop } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { Suspense, useCallback, useEffect, useState } from 'react';

import { ProductList } from '@/widgets/product-list';
import { PhoneBulkBar } from '@/features/bulk-edit-products';
import { ProductSearch } from '@/features/product-search';
import { productCountsQueryOptions, productsQueryOptions } from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { PageTitle, Toast } from '@/shared/ui';

import { type ProductsSearch, toListParams } from '@/pages/products/lib';

import { CategorySelect } from './category-select';
import { EmptyProducts } from './empty-products';
import { FilterTabs } from './filter-tabs';
import { PhotoBanner } from './photo-banner';
import { SelectionHeader } from './selection-header';

/**
 * Раздел «Товары» (FR-A5). Телефон — макет AdminPhone, экран 2: поиск, вкладки, баннер «N без фото», список;
 * выбор долгим нажатием — шапка «Выбрано N» и тёмная панель действий вместо меню (A20).
 * Компьютер — макет AdminDesk, экран 1: «Загрузить Excel» и «Товар», поиск, вкладки, категория, таблица.
 * Пока товаров нет — «Добавьте первые товары» (AdminPhone2, экран 6; компьютер — доска AdminProductsStates).
 * Выбор в списке живёт в адресе; после массового действия — сообщение внизу.
 */
export function ProductsPage({
  search,
  onSearchChange,
}: {
  search: ProductsSearch;
  onSearchChange: (search: ProductsSearch) => void;
}) {
  const { t } = useLingui();
  const isDesktop = useIsDesktop();
  const { data: counts } = useSuspenseQuery(productCountsQueryOptions());
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const params = toListParams(search);
  // та же выборка, что у списка (общий кеш), — для «Выбрать все»
  const { data: loaded } = useInfiniteQuery(productsQueryOptions(params));
  const change = (patch: Partial<ProductsSearch>) => onSearchChange({ ...search, ...patch });

  // выбор живёт в пределах выборки: сменили поиск, вкладку или категорию — выбор снят
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const hideMessage = useCallback(() => setMessage(null), []);
  const paramsKey = JSON.stringify(params);
  useEffect(() => setSelected(new Set()), [paramsKey]);
  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const clear = () => setSelected(new Set());
  const selectingOnPhone = !isDesktop && selected.size > 0;
  const hasRows = (loaded?.pages[0]?.items.length ?? 0) > 0;

  if (counts.all === 0) {
    return (
      <>
        <PageTitle>
          <Trans>Товары</Trans>
        </PageTitle>
        <EmptyProducts />
      </>
    );
  }

  return (
    <>
      {selectingOnPhone ? (
        <SelectionHeader
          count={selected.size}
          onClose={clear}
          onSelectAll={() => setSelected(new Set(loaded?.pages.flatMap((page) => page.items.map((item) => item.id))))}
        />
      ) : (
        <PageTitle
          actions={
            <>
              {counts.noPhoto > 0 && (
                <Link
                  to="/products/photos"
                  className="press hidden h-11 items-center gap-2 rounded-pill border-[1.5px] border-line bg-white px-[18px] text-[14px] font-bold hover:border-line-hover lg:inline-flex"
                >
                  <Icon name="camera" size={18} />
                  <Trans>Добавить фото</Trans>
                </Link>
              )}
              <Link
                to="/import"
                className="press hidden h-11 items-center gap-2 rounded-pill border-[1.5px] border-line bg-white px-[18px] text-[14px] font-bold hover:border-line-hover lg:inline-flex"
              >
                <Icon name="upload" size={18} />
                <Trans>Загрузить Excel</Trans>
              </Link>
              <Link
                to="/products/new"
                aria-label={t`Новый товар`}
                className="press flex size-11 items-center justify-center rounded-full bg-ink-night text-white hover:bg-ink-hover lg:size-auto lg:h-11 lg:gap-2 lg:rounded-pill lg:px-[22px] lg:text-[14px] lg:font-bold lg:shadow-press-ink"
              >
                <Icon name="plus" size={22} strokeWidth={2.4} className="lg:size-[18px]" />
                <span className="hidden lg:inline">
                  <Trans>Товар</Trans>
                </span>
              </Link>
            </>
          }
        >
          <Trans>Товары</Trans>
        </PageTitle>
      )}
      <div className="mt-3 lg:mt-[18px] lg:flex lg:items-center lg:gap-3">
        <ProductSearch value={search.q ?? ''} onChange={(q) => change({ q: q || undefined })} />
        <FilterTabs
          value={search.filter}
          counts={counts}
          onChange={(filter) => change({ filter })}
          className="-mx-4 mt-3.5 overflow-x-auto px-4 [scrollbar-width:none] lg:mx-0 lg:mt-0 lg:overflow-visible lg:px-0"
        />
        <span className="hidden flex-1 lg:block" />
        <div className="hidden lg:block">
          <Suspense>
            <CategorySelect value={search.category} onChange={(category) => change({ category })} />
          </Suspense>
        </div>
      </div>
      {/* баннер — над списком товаров; при загрузке, ошибке и пустой выборке его нет (доска AdminProductsStates) */}
      {counts.noPhoto > 0 && hasRows && !selectingOnPhone && (
        <div className="lg:hidden">
          <PhotoBanner count={counts.noPhoto} />
        </div>
      )}
      <ProductList
        params={params}
        lowStockThreshold={shop.lowStockThreshold}
        selected={selected}
        onToggle={toggle}
        onClear={clear}
        onDone={setMessage}
        onResetSearch={() => change({ q: undefined })}
      />
      {selectingOnPhone && <PhoneBulkBar productIds={[...selected]} onClear={clear} onDone={setMessage} />}
      <Toast message={message} onHide={hideMessage} />
    </>
  );
}
