import type { StorefrontFacets } from '@catalog/contract';
import { Button, Sheet, SizeChip } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';

import { buildFilterSections, toggleValue } from '@/features/product-filters/lib';
import type { FilterState } from '@/features/product-filters/types';
import { PriceRange } from '../price-range';

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
  const sections = buildFilterSections(all, current, state.values);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={<Trans>Фильтры</Trans>}
      headerAction={
        <button type="button" onClick={onReset} className="py-1.5 text-[14px] font-semibold text-iris hover:underline">
          <Trans>Сбросить</Trans>
        </button>
      }
    >
      {sections.map((section) => (
        <section key={section.id} className="mt-4 mb-[18px] first:mt-0.5">
          <h3 className="text-[15px] font-bold">{section.name}</h3>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {section.values.map((value) => (
              <SizeChip
                key={value.id}
                selected={value.selected}
                onClick={() => onChange({ ...state, values: toggleValue(state.values, value.id) })}
              >
                {value.value}
              </SizeChip>
            ))}
          </div>
        </section>
      ))}

      <section>
        <h3 className="mb-2.5 text-[15px] font-bold">{t`Цена, ₸`}</h3>
        <PriceRange
          min={state.priceMin}
          max={state.priceMax}
          bounds={current.price}
          onChange={(range) => onChange({ ...state, ...range })}
        />
      </section>

      <Button block flat className="mt-5" onClick={onClose}>
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
