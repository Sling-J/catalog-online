import { cx } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';

import type { ProductFilter } from '@/entities/product';

export type ProductCounts = { all: number; noPhoto: number; outOfStock: number; hidden: number };

/**
 * Вкладки «Все», «Без фото», «Нет в наличии», «Скрытые» со счётчиками (макеты AdminPhone, экран 2, и AdminDesk,
 * экран 1). У выбранной счётчик на жёлтом. На телефоне вкладки листаются вбок.
 */
export function FilterTabs({
  value,
  counts,
  onChange,
  className,
}: {
  value: ProductFilter | undefined;
  counts: ProductCounts;
  onChange: (filter: ProductFilter | undefined) => void;
  className?: string;
}) {
  const { t } = useLingui();
  const tabs: { filter: ProductFilter | undefined; label: string; count: number }[] = [
    { filter: undefined, label: t`Все`, count: counts.all },
    { filter: 'no_photo', label: t`Без фото`, count: counts.noPhoto },
    { filter: 'out_of_stock', label: t`Нет в наличии`, count: counts.outOfStock },
    { filter: 'hidden', label: t`Скрытые`, count: counts.hidden },
  ];
  return (
    <div className={cx('flex gap-2', className)}>
      {tabs.map((tab) => {
        const selected = tab.filter === value;
        return (
          <button
            key={tab.label}
            type="button"
            aria-pressed={selected}
            onClick={() => onChange(tab.filter)}
            className={cx(
              'inline-flex h-[38px] flex-none items-center gap-1.5 rounded-pill px-3.5 text-[14px] font-semibold',
              selected ? 'bg-ink-night text-white hover:bg-ink-hover' : 'bg-chip-haze hover:bg-haze-hover',
            )}
          >
            {tab.label}
            <span
              className={cx(
                'inline-flex h-5 min-w-5 items-center justify-center rounded-pill px-1.5 text-[12px] font-bold text-ink-night tabular-nums',
                selected ? 'bg-sun' : 'bg-white',
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
