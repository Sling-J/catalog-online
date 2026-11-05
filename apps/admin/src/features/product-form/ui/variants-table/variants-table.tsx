import { cx, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useStore } from '@tanstack/react-form';

import type { ProductForm } from '../../hooks';
import { digitsOf, newRow, rowLabel } from '../../lib';
import { AmountInput } from '../amount-input';
import { DraftErrorText } from '../draft-error-text';
import { ExcelMark } from '../excel-mark';

const GRID = 'grid grid-cols-[110px_1fr_140px_120px_170px_40px] items-center gap-3 px-[18px] tabular-nums';
const BOXED =
  'w-full min-w-0 rounded-[10px] border-[1.5px] border-[#e2dff0] px-2.5 py-2 outline-none focus:border-ink-night';
const PLAIN = 'w-full min-w-0 bg-transparent outline-none placeholder:text-ink-muted';

/**
 * Варианты на компьютере (макет AdminDesk, экран 2): артикул, размер, цена и остаток в полях, штрихкод, убрать.
 * Артикул и штрихкод сохранённого варианта — из учёта, только для чтения; у новой строки их можно вписать.
 */
export function VariantsTable({
  form,
  attributeName,
  imported,
}: {
  form: ProductForm;
  attributeName: string | undefined;
  imported: boolean;
}) {
  const { t } = useLingui();
  const attributeId = useStore(form.store, (state) => state.values.attributeId);
  const sized = attributeId !== null;
  return (
    <form.Field name="rows" mode="array">
      {(rowsField) => {
        const rows = rowsField.state.value;
        return (
          <div>
            <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_1px_0_#eceaf5,0_6px_16px_rgba(40,30,110,.05)]">
              <div className="flex items-center justify-between px-[18px] pt-3.5">
                <span className="text-[15px] font-bold">
                  <Trans>Варианты · {rows.length}</Trans>
                </span>
                <span className="flex gap-3.5 text-[13px]">
                  {imported && <ExcelMark />}
                  <button
                    type="button"
                    onClick={() => rowsField.pushValue(newRow(attributeId, '', { price: rows.at(-1)?.price ?? '' }))}
                    className="font-semibold text-iris"
                  >
                    <Trans>+ Вариант</Trans>
                  </button>
                </span>
              </div>
              <div className={cx(GRID, 'pt-3 pb-2 text-[12px] font-semibold text-ink-quiet')}>
                <span>
                  <Trans>Артикул</Trans>
                </span>
                <span>{sized ? attributeName : null}</span>
                <span>
                  <Trans>Цена</Trans>
                </span>
                <span>
                  <Trans>Остаток</Trans>
                </span>
                <span>
                  <Trans>Штрихкод</Trans>
                </span>
                <span />
              </div>
              {rows.map((row, index) => (
                <div key={row.key} className={cx(GRID, 'border-t border-[#f0eef7] py-2 text-[14px]')}>
                  {row.id ? (
                    <span className="text-ink-quiet">{row.sku}</span>
                  ) : (
                    <form.Field name={`rows[${index}].sku`}>
                      {(field) => (
                        <input
                          value={field.state.value}
                          maxLength={64}
                          placeholder={t`авто`}
                          aria-label={t`Артикул`}
                          onChange={(event) => field.handleChange(event.target.value)}
                          className={cx(PLAIN, 'text-ink-quiet')}
                        />
                      )}
                    </form.Field>
                  )}
                  {row.id || !sized ? (
                    <span className="font-semibold">{rowLabel(row)}</span>
                  ) : (
                    <form.Field name={`rows[${index}].values`}>
                      {(field) => (
                        <input
                          autoFocus
                          value={rowLabel(row)}
                          maxLength={60}
                          aria-label={attributeName}
                          onChange={(event) => field.handleChange([{ attributeId, value: event.target.value }])}
                          className={cx(BOXED, 'font-semibold')}
                        />
                      )}
                    </form.Field>
                  )}
                  <form.Field name={`rows[${index}].price`}>
                    {(field) => (
                      <AmountInput
                        value={field.state.value}
                        aria-label={t`Цена: ${rowLabel(row)}`}
                        onValueChange={field.handleChange}
                        className={BOXED}
                      />
                    )}
                  </form.Field>
                  <form.Field name={`rows[${index}].stock`}>
                    {(field) => (
                      <input
                        inputMode="numeric"
                        value={String(field.state.value)}
                        aria-label={t`Остаток: ${rowLabel(row)}`}
                        onChange={(event) => field.handleChange(Number(digitsOf(event.target.value).slice(0, 6)))}
                        className={cx(BOXED, field.state.value === 0 && 'text-stock-out')}
                      />
                    )}
                  </form.Field>
                  {row.id ? (
                    <span className="text-ink-quiet">{row.barcode}</span>
                  ) : (
                    <form.Field name={`rows[${index}].barcode`}>
                      {(field) => (
                        <input
                          value={field.state.value}
                          maxLength={64}
                          placeholder={t`необязательно`}
                          aria-label={t`Штрихкод`}
                          onChange={(event) => field.handleChange(event.target.value)}
                          className={cx(PLAIN, 'text-ink-quiet')}
                        />
                      )}
                    </form.Field>
                  )}
                  {rows.length > 1 ? (
                    <button
                      type="button"
                      aria-label={t`Убрать вариант ${rowLabel(row)}`}
                      onClick={() => void rowsField.removeValue(index)}
                      className="text-ink-muted hover:text-ink-night"
                    >
                      <Icon name="close" size={16} />
                    </button>
                  ) : (
                    <span />
                  )}
                </div>
              ))}
            </div>
            <DraftErrorText error={rowsField.state.meta.errors[0]} />
          </div>
        );
      }}
    </form.Field>
  );
}
