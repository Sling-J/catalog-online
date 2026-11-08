import type { ProductListItem } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { BulkBar } from '@/features/bulk-edit-products';
import { type ProductSort, useSortLabels } from '@/entities/product';

import { COLUMNS, SKELETON_ROWS } from '../../constants';
import { nextSort, type SortColumn, sortDirection } from '../../lib';
import { SortHeader } from '../sort-header';
import { TableRow } from './table-row';

/**
 * Таблица товаров на компьютере (макет AdminDesk, экран 1): полоса массовых действий, когда что-то выбрано,
 * заголовки колонок («Название», «Цена», «Остаток» упорядочивают список — UX-аудит, E3), строки и подвал «Показано N из M». Вместо строк — загрузка (`loading`) или состояние
 * (`placeholder`: ничего не нашлось, пустая вкладка, ошибка — доска AdminProductsStates). Карточка без
 * overflow-hidden: иначе у короткой таблицы обрезался бы список категорий.
 */
export function ProductTable({
  products,
  total,
  hasMore,
  loading,
  placeholder,
  lowStockThreshold,
  selected,
  onToggle,
  onClear,
  onDone,
  sort,
  onSortChange,
  children,
}: {
  products: ProductListItem[];
  total: number;
  hasMore: boolean;
  loading: boolean;
  placeholder: ReactNode;
  lowStockThreshold: number;
  selected: Set<string>;
  onToggle: (id: string) => void;
  onClear: () => void;
  onDone: (message: string) => void;
  sort: ProductSort | undefined;
  onSortChange: (sort: ProductSort | undefined) => void;
  /** Маркер подгрузки следующей страницы. */
  children?: ReactNode;
}) {
  const { t } = useLingui();
  const labels = useSortLabels();
  const header = (column: SortColumn, label: ReactNode) => {
    const next = nextSort(column, sort);
    return (
      <SortHeader
        direction={sortDirection(column, sort)}
        hint={labels[next ?? 'new']}
        onClick={() => onSortChange(next)}
      >
        {label}
      </SortHeader>
    );
  };
  return (
    <div className="mt-4 rounded-[24px] bg-white shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.05)]">
      {selected.size > 0 && <BulkBar productIds={[...selected]} onClear={onClear} onDone={onDone} />}
      <div role="table" aria-label={t`Товары`} aria-busy={loading}>
        <div role="row" className={cx(COLUMNS, 'py-3 text-[12px] font-semibold text-ink-quiet')}>
          <span role="columnheader" />
          <span role="columnheader">
            <Trans>Фото</Trans>
          </span>
          {header('name', <Trans>Название</Trans>)}
          <span role="columnheader">
            <Trans>Категория</Trans>
          </span>
          <span role="columnheader">
            <Trans>Варианты</Trans>
          </span>
          {header('price', <Trans>Цена</Trans>)}
          {header('stock', <Trans>Остаток</Trans>)}
          <span role="columnheader">
            <Trans>Витрина</Trans>
          </span>
        </div>
        {loading
          ? SKELETON_ROWS.map(([name, sub], index) => (
              <div
                key={index}
                aria-hidden="true"
                className={cx(COLUMNS, 'items-center border-t border-[#f0eef7] py-2.5')}
              >
                <span className="size-5 rounded-md border-[1.5px] border-[#c9c3e3] bg-white" />
                <span className="size-12 rounded-xl bg-chip-haze" />
                <div>
                  <div className="h-3.5 rounded-[7px] bg-chip-haze" style={{ width: name }} />
                  <div className="mt-2 h-3 rounded-md bg-[#f3f2fa]" style={{ width: sub - 30 }} />
                </div>
                {[90, 70, 70, 50].map((width, cell) => (
                  <div key={cell} className="h-3.5 rounded-[7px] bg-chip-haze" style={{ width }} />
                ))}
                <span className="h-7 w-[46px] rounded-pill bg-chip-haze" />
              </div>
            ))
          : products.map((product) => (
              <TableRow
                key={product.id}
                product={product}
                lowStockThreshold={lowStockThreshold}
                selected={selected.has(product.id)}
                onToggle={() => onToggle(product.id)}
              />
            ))}
      </div>
      {placeholder ? (
        <div className="border-t border-[#f0eef7] px-6 pt-16 pb-[72px]">{placeholder}</div>
      ) : (
        !loading && (
          <>
            {children}
            <div className="flex justify-between border-t border-[#f0eef7] px-[18px] py-3.5 text-[13px] text-ink-quiet">
              <span>
                <Trans>
                  Показано {products.length} из {total}
                </Trans>
              </span>
              {hasMore && (
                <span>
                  <Trans>Подгружаются при прокрутке</Trans>
                </span>
              )}
            </div>
          </>
        )
      )}
    </div>
  );
}
