import type { StorefrontFacets } from '@catalog/contract';
import { Icon, formatPrice } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';

import { getActiveValueFilters, toggleValue } from '@/features/product-filters/lib';
import type { FilterState } from '@/features/product-filters/types';

/** Выбранные фильтры сиреневыми чипами с крестиком — снять можно, не открывая шторку. Только на телефоне. */
export function ActiveFilters({
  all,
  state,
  onChange,
}: {
  all: StorefrontFacets;
  state: FilterState;
  onChange: (state: FilterState) => void;
}) {
  const { t } = useLingui();
  const values = getActiveValueFilters(all, state.values);
  const { priceMin, priceMax } = state;
  const hasPrice = priceMin !== undefined || priceMax !== undefined;
  if (values.length === 0 && !hasPrice) return null;

  const priceLabel =
    priceMin !== undefined && priceMax !== undefined
      ? `${formatPrice(priceMin)} – ${formatPrice(priceMax)}`
      : priceMin !== undefined
        ? t`от ${formatPrice(priceMin)}`
        : t`до ${formatPrice(priceMax ?? 0)}`;

  return (
    <div className="flex gap-2 overflow-x-auto px-4 pb-3 lg:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {values.map((filter) => (
        <RemovableChip
          key={filter.id}
          label={`${filter.attributeName} ${filter.value}`}
          removeLabel={t`Убрать фильтр: ${filter.attributeName} ${filter.value}`}
          onRemove={() => onChange({ ...state, values: toggleValue(state.values, filter.id) })}
        />
      ))}
      {hasPrice && (
        <RemovableChip
          label={priceLabel}
          removeLabel={t`Убрать фильтр по цене`}
          onRemove={() => onChange({ ...state, priceMin: undefined, priceMax: undefined })}
        />
      )}
    </div>
  );
}

function RemovableChip({ label, removeLabel, onRemove }: { label: string; removeLabel: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      aria-label={removeLabel}
      className="inline-flex h-8 shrink-0 items-center gap-2 rounded-pill bg-[#e9e5ff] px-3 hover:bg-[#ddd7ff] text-[13px] font-semibold text-iris focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris"
    >
      {label}
      <Icon name="close" size={12} strokeWidth={3} />
    </button>
  );
}
