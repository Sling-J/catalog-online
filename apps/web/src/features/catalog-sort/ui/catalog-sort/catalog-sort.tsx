import { useLingui } from '@lingui/react/macro';

import type { ProductSort } from '@/entities/product';

const SORTS: ProductSort[] = ['new', 'price_asc', 'price_desc'];

/** Сортировка сетки: новые, дешевле, дороже. Выбор — нативный список, на телефоне это системное окно выбора. */
export function CatalogSort({ value, onChange }: { value: ProductSort; onChange: (sort: ProductSort) => void }) {
  const { t } = useLingui();
  const labels: Record<ProductSort, string> = {
    new: t`Новые`,
    price_asc: t`Дешевле`,
    price_desc: t`Дороже`,
  };

  return (
    <label className="relative flex items-center gap-1 py-1.5 text-[13px] font-semibold">
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
