import { cx, Icon } from '@catalog/ui';
import { Plural, Trans, useLingui } from '@lingui/react/macro';
import { useStore } from '@tanstack/react-form';
import { useState } from 'react';

import type { ProductForm } from '../../hooks';
import { digitsOf, newRow, rowLabel } from '../../lib';
import { AmountInput } from '../amount-input';
import { DraftErrorText } from '../draft-error-text';
import { ExcelMark } from '../excel-mark';
import { FieldLabel } from '../field-label';

const SHOWN = 3;
// ячейки таблицы правятся на месте: выглядят текстом, как в макете
const CELL = 'w-full min-w-0 rounded-md bg-transparent outline-none focus:bg-[#f4f1ff]';

/**
 * Варианты на телефоне (макет AdminPhone, экран 3): «Рост · Цена · Остаток», первые три строки, «Ещё N вариантов»
 * и «+ Размер». Цена и остаток правятся прямо в строке; у новой строки размер вписывается. Справа «×» — убрать
 * вариант (решение основателя 2026-11-05, в макете нет): внутри ячейки остатка; у единственного варианта его нет.
 */
export function VariantsCard({
  form,
  attributeName,
  imported,
}: {
  form: ProductForm;
  attributeName: string | undefined;
  imported: boolean;
}) {
  const { t } = useLingui();
  const [expanded, setExpanded] = useState(false);
  const attributeId = useStore(form.store, (state) => state.values.attributeId);
  const sized = attributeId !== null;
  const grid = cx(
    'grid gap-2 px-3 py-[9px] tabular-nums',
    sized ? 'grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]' : 'grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]',
  );
  return (
    <form.Field name="rows" mode="array">
      {(rowsField) => {
        const all = rowsField.state.value;
        const rows = expanded ? all : all.slice(0, SHOWN);
        const more = all.length - rows.length;
        return (
          <div className="px-4 pt-3">
            <FieldLabel note={imported && <ExcelMark />}>
              <Trans>Варианты · {all.length}</Trans>
            </FieldLabel>
            <div className="overflow-hidden rounded-field border-[1.5px] border-[#e2dff0] bg-white">
              <div className={cx(grid, 'text-[12px] font-semibold text-ink-quiet')}>
                {sized && <span>{attributeName}</span>}
                <span>
                  <Trans>Цена</Trans>
                </span>
                <span>
                  <Trans>Остаток</Trans>
                </span>
              </div>
              {rows.map((row, index) => (
                <div key={row.key} className={cx(grid, 'border-t border-[#f0eef7] text-[15px]')}>
                  {sized &&
                    (row.id ? (
                      <span>{rowLabel(row)}</span>
                    ) : (
                      <form.Field name={`rows[${index}].values`}>
                        {(field) => (
                          <input
                            autoFocus
                            value={rowLabel(row)}
                            maxLength={60}
                            placeholder={t`Размер`}
                            aria-label={attributeName}
                            onChange={(event) => field.handleChange([{ attributeId, value: event.target.value }])}
                            className={cx(CELL, 'placeholder:text-ink-muted')}
                          />
                        )}
                      </form.Field>
                    ))}
                  <form.Field name={`rows[${index}].price`}>
                    {(field) => (
                      <AmountInput
                        value={field.state.value}
                        aria-label={t`Цена: ${rowLabel(row)}`}
                        onValueChange={field.handleChange}
                        className={CELL}
                      />
                    )}
                  </form.Field>
                  {/* «×» внутри ячейки остатка — колонки остаются как в макете */}
                  <span className="flex items-center gap-1">
                    <form.Field name={`rows[${index}].stock`}>
                      {(field) => (
                        <input
                          inputMode="numeric"
                          value={String(field.state.value)}
                          aria-label={t`Остаток: ${rowLabel(row)}`}
                          onChange={(event) => field.handleChange(Number(digitsOf(event.target.value).slice(0, 6)))}
                          className={cx(CELL, field.state.value === 0 && 'text-stock-out')}
                        />
                      )}
                    </form.Field>
                    {all.length > 1 ? (
                      <button
                        type="button"
                        aria-label={t`Убрать вариант ${rowLabel(row)}`}
                        onClick={() => void rowsField.removeValue(index)}
                        className="flex flex-none items-center text-ink-muted hover:text-ink-night"
                      >
                        <Icon name="close" size={16} />
                      </button>
                    ) : null}
                  </span>
                </div>
              ))}
              {(more > 0 || sized) && (
                <div className="flex justify-between border-t border-[#f0eef7] px-3 py-[9px] text-[13px] font-semibold text-iris">
                  {more > 0 ? (
                    <button type="button" onClick={() => setExpanded(true)}>
                      <Plural value={more} one="Ещё # вариант" few="Ещё # варианта" other="Ещё # вариантов" />
                    </button>
                  ) : (
                    <span />
                  )}
                  {sized && (
                    <button
                      type="button"
                      onClick={() => {
                        setExpanded(true);
                        rowsField.pushValue(newRow(attributeId, '', { price: all.at(-1)?.price ?? '' }));
                      }}
                    >
                      <Trans>+ Размер</Trans>
                    </button>
                  )}
                </div>
              )}
            </div>
            <DraftErrorText error={rowsField.state.meta.errors[0]} />
          </div>
        );
      }}
    </form.Field>
  );
}
