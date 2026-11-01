import type { StorefrontFacets } from '@catalog/contract';
import { Chip } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';

import { formatPrice } from '@/shared/lib';
import { Icon } from '@/shared/ui';

import { getActiveValueFilters, toggleValue } from '@/features/product-filters/lib';
import type { FilterState } from '@/features/product-filters/types';

/** Выбранные фильтры чипами с крестиком — снять можно, не открывая шторку. */
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
    <div className="flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
    <Chip selected onClick={onRemove} aria-label={removeLabel} className="h-8 gap-1.5 pr-2.5 pl-3.5 text-[13px]">
      {label}
      <Icon name="close" size={14} />
    </Chip>
  );
}
