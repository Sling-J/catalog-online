import type { StorefrontFacets } from '@catalog/contract';
import { Button, Chip, Sheet } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { useSheetPlacement } from '@/shared/hooks';

import { buildFilterSections, countActiveFilters, toggleValue } from '@/features/product-filters/lib';
import type { FilterState } from '@/features/product-filters/types';
import { PriceRange } from './price-range';

/**
 * Шторка фильтров: значения свойств, которые есть в выборке, и цена «от — до».
 * Выбор сразу попадает в адрес, а кнопка внизу показывает, сколько товаров осталось.
 */
export function FiltersSheet({
  open,
  onClose,
  all,
  current,
  state,
  onChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  /** Фасеты всего магазина — чтобы подписать выбранное. */
  all: StorefrontFacets;
  /** Фасеты текущей выборки. */
  current: StorefrontFacets;
  state: FilterState;
  onChange: (state: FilterState) => void;
  onReset: () => void;
}) {
  const { t } = useLingui();
  const placement = useSheetPlacement();
  const sections = buildFilterSections(all, current, state.values);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      placement={placement}
      title={<Trans>Фильтры</Trans>}
      headerAction={
        countActiveFilters(state) > 0 ? (
          <button type="button" onClick={onReset} className="py-1.5 text-[14px] font-semibold text-[#3b2fd9]">
            <Trans>Сбросить</Trans>
          </button>
        ) : undefined
      }
    >
      {sections.map((section) => (
        <section key={section.id} className="mb-[18px]">
          <h3 className="text-[15px] font-bold">{section.name}</h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {section.values.map((value) => (
              <Chip
                key={value.id}
                selected={value.selected}
                onClick={() => onChange({ ...state, values: toggleValue(state.values, value.id) })}
              >
                {value.value}
              </Chip>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h3 className="mb-2.5 text-[15px] font-bold">{t`Цена`}</h3>
        <PriceRange
          min={state.priceMin}
          max={state.priceMax}
          bounds={current.price}
          onChange={(range) => onChange({ ...state, ...range })}
        />
      </section>

      <Button block className="mt-5" onClick={onClose}>
        <Plural
          value={current.total}
          one="Показать # товар"
          few="Показать # товара"
          many="Показать # товаров"
          other="Показать # товара"
        />
      </Button>
    </Sheet>
  );
}
