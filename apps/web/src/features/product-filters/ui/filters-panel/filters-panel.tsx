import type { StorefrontFacets } from '@catalog/contract';
import { cx, SizeChip } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useRef, useState } from 'react';

import { buildFilterSections, toggleValue } from '@/features/product-filters/lib';
import type { FilterState } from '@/features/product-filters/types';
import { PriceRange } from '../price-range';

// длительность animate-pop-out в tokens.css
const CLOSE_MS = 160;

/**
 * Фильтры на компьютере (макет «Фильтры · компьютер», вариант Г): панель поверх сетки сразу под строкой категорий,
 * сетка под ней бледнеет и не сдвигается. Свойства и цена — в четыре колонки, внизу «Сбросить» и
 * «Показать N товаров». Выбор сразу попадает в адрес. Закрывается кнопкой внизу, по Esc и кликом по сетке.
 * Ставится внутрь контейнера с `relative`, который начинается под строкой категорий.
 */
export function FiltersPanel({
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
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(open);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // закрытие с анимацией: панель гаснет, потом убираем её из разметки
  useEffect(() => {
    if (open) {
      setShown(true);
      return;
    }
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(false);
      return;
    }
    const id = setTimeout(() => setShown(false), CLOSE_MS);
    return () => clearTimeout(id);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onCloseRef.current();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  if (!shown) return null;
  const sections = buildFilterSections(all, current, state.values);

  return (
    <div className="hidden lg:block">
      <div
        aria-hidden="true"
        onClick={onClose}
        className={cx(
          'absolute inset-x-0 -top-2 bottom-0 z-20 bg-paper/70',
          open ? 'motion-safe:animate-fade-fast' : 'motion-safe:animate-fade-out',
        )}
      />
      <div className="pointer-events-none absolute inset-x-0 -top-3 z-20">
        <div className="mx-auto max-w-[1240px] px-5">
          <div
            ref={ref}
            role="dialog"
            aria-label={t`Фильтры`}
            tabIndex={-1}
            className={cx(
              'pointer-events-auto rounded-[22px] border border-[#eceaf5] bg-white px-6 py-[22px] shadow-[0_24px_60px_rgb(23_19_61/0.18)] outline-none',
              open ? 'motion-safe:animate-pop' : 'pointer-events-none motion-safe:animate-pop-out',
            )}
          >
            <div className="grid grid-cols-4 gap-x-7 gap-y-[22px]">
              {sections.map((section) => (
                <div key={section.id} role="group" aria-labelledby={`filter-${section.id}`}>
                  <h3 id={`filter-${section.id}`} className="mb-2.5 text-[15px] font-bold">
                    {section.name}
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
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
                </div>
              ))}
              <div>
                <h3 className="mb-2.5 text-[15px] font-bold">{t`Цена, ₸`}</h3>
                <PriceRange
                  compact
                  min={state.priceMin}
                  max={state.priceMax}
                  bounds={current.price}
                  onChange={(range) => onChange({ ...state, ...range })}
                />
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-[#f0eef7] pt-4">
              <button type="button" onClick={onReset} className="text-[14px] font-semibold text-iris hover:underline">
                <Trans>Сбросить</Trans>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 items-center rounded-pill bg-ink-night px-[22px] text-[15px] font-bold whitespace-nowrap text-white tabular-nums hover:bg-ink-hover focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris"
              >
                <Plural
                  value={current.total}
                  one="Показать # товар"
                  few="Показать # товара"
                  many="Показать # товаров"
                  other="Показать # товара"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
