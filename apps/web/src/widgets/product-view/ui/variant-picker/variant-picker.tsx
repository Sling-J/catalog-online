import type { StorefrontProduct } from '@catalog/contract';
import { SizeChip } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { getValueState, toggleSelection, type Selection } from '@/entities/product';

/**
 * Выбор варианта чипами по каждому свойству. Закончившиеся значения зачёркнуты пунктиром и не выбираются,
 * невозможные сочетания неактивны (FR-V6).
 */
export function VariantPicker({
  product,
  selection,
  onChange,
}: {
  product: StorefrontProduct;
  selection: Selection;
  onChange: (selection: Selection) => void;
}) {
  return (
    <>
      {product.attributes.map((attribute, position) => (
        <section key={attribute.id} className="mt-5 lg:first:mt-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-[15px] font-bold">{attribute.name}</h2>
            {position === 0 && (
              <p className="text-caption text-ink-quiet">
                <Trans>зачёркнутых нет в наличии</Trans>
              </p>
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap gap-2">
            {attribute.values.map((value) => {
              const state = getValueState(product, selection, attribute.id, value.id);
              const selected = selection[attribute.id] === value.id;
              return (
                <SizeChip
                  key={value.id}
                  selected={selected}
                  out={state === 'out' && !selected}
                  // закончившийся вариант выбрать нельзя, но снять уже выбранный (если он стал таким) можно
                  disabled={state === 'impossible' && !selected}
                  aria-disabled={state === 'out' && !selected ? true : undefined}
                  onClick={() => {
                    if (state === 'out' && !selected) return;
                    onChange(toggleSelection(selection, attribute.id, value.id));
                  }}
                  className={state === 'impossible' && !selected ? 'opacity-40' : undefined}
                >
                  {value.value}
                </SizeChip>
              );
            })}
          </div>
        </section>
      ))}
    </>
  );
}
