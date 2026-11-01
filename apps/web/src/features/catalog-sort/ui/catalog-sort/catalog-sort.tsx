import { cx } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';

import type { ProductSort } from '@/entities/product';

const SORTS: ProductSort[] = ['new', 'price_asc', 'price_desc'];

/** Сортировка сетки: новые, дешевле, дороже. Выбор — нативный список, на телефоне это системное окно выбора. */
export function CatalogSort({
  value,
  onChange,
  pill,
}: {
  value: ProductSort;
  onChange: (sort: ProductSort) => void;
  /** Рамка-«пилюля» — в строке категорий на компьютере; без неё — текст над сеткой на телефоне. */
  pill?: boolean;
}) {
  const { t } = useLingui();
  const labels: Record<ProductSort, string> = {
    new: t`Сначала новые`,
    price_asc: t`Сначала дешевле`,
    price_desc: t`Сначала дороже`,
  };

  return (
    <label
      className={cx(
        'relative flex items-center font-semibold',
        pill
          ? 'h-10 gap-1.5 rounded-pill border-[1.5px] border-line bg-white px-4 text-[14px] hover:border-line-hover'
          : 'gap-1 py-1.5 text-[13px]',
      )}
    >
      <span>{labels[value]}</span>
      <svg
        aria-hidden="true"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <path d="M7 10l5 5 5-5" />
      </svg>
      <select
        aria-label={t`Сортировка`}
        value={value}
        onChange={(event) => onChange(event.target.value as ProductSort)}
        className="absolute inset-0 cursor-pointer opacity-0"
      >
        {SORTS.map((sort) => (
          <option key={sort} value={sort}>
            {labels[sort]}
          </option>
        ))}
      </select>
    </label>
  );
}
