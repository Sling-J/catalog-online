import type { StorefrontFacets } from '@catalog/contract';
import { SizeChip } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { buildFilterSections, toggleValue } from '@/features/product-filters/lib';
import type { FilterState } from '@/features/product-filters/types';

/**
 * Фильтры строкой для компьютера: раскрываются под категориями, значения каждого свойства — квадратными чипами,
 * в конце «Сбросить». Цены здесь нет — её нет в макете компьютера. Выбор сразу попадает в адрес.
 */
export function FiltersPanel({
  all,
  current,
  state,
  onChange,
  onReset,
}: {
  all: StorefrontFacets;
  current: StorefrontFacets;
  state: FilterState;
  onChange: (state: FilterState) => void;
  onReset: () => void;
}) {
  const sections = buildFilterSections(all, current, state.values);

  return (
    <div className="mb-3.5 flex flex-wrap items-center gap-x-[22px] gap-y-3 rounded-row border border-[#eceaf5] bg-white px-[18px] py-4 text-[14px]">
      {sections.map((section) => (
        <div key={section.id} role="group" aria-label={section.name} className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1.5 font-bold">{section.name}</span>
          {section.values.map((value) => (
            <SizeChip
              key={value.id}
              size="sm"
              selected={value.selected}
              onClick={() => onChange({ ...state, values: toggleValue(state.values, value.id) })}
            >
              {value.value}
            </SizeChip>
          ))}
        </div>
      ))}
      <button type="button" onClick={onReset} className="font-semibold text-iris">
        <Trans>Сбросить</Trans>
      </button>
    </div>
  );
}
