import type { Attribute } from '@catalog/contract';
import { cx, formatPrice, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useStore } from '@tanstack/react-form';

import type { ProductForm } from '../../hooks';
import { newRow, nextSizes, rowLabel } from '../../lib';
import { AmountInput } from '../amount-input';
import { DraftErrorText } from '../draft-error-text';
import { AttributePicker } from './attribute-picker';
import { QtyStepper } from './qty-stepper';
import { SizeChips } from './size-chips';

// на телефоне артикул и штрихкод не показываем — колонки скрыты, сетка из четырёх
const GRID = {
  phone: 'grid grid-cols-[64px_minmax(0,1fr)_84px_28px] gap-2',
  desk: 'grid grid-cols-[90px_1fr_160px_150px_200px_30px] gap-3 px-[18px]',
};
// в макете 40 px плюс рамка (content-box); рамку 1,5 px браузер рисует в 1 px — всего 42
const FIELD = 'h-[42px] rounded-xl border-[1.5px] border-[#e2dff0] px-3 outline-none focus:border-ink-night';

/**
 * «Размеры и количество» нового товара: свойство таблицы, строки размеров с ценой и количеством, чипы следующих
 * размеров и «Свой размер». Телефон — макет AdminPhone2, экран 7; компьютер — AdminDesk2, экран 6 (белая карточка,
 * плюс артикул «авто» и штрихкод). Без размеров — одна строка, только количество.
 */
export function SizesEditor({
  form,
  attributes,
  desktop,
}: {
  form: ProductForm;
  attributes: Attribute[];
  desktop: boolean;
}) {
  const { t } = useLingui();
  const attributeId = useStore(form.store, (state) => state.values.attributeId);
  const price = useStore(form.store, (state) => state.values.price);
  const attribute = attributes.find((item) => item.id === attributeId);
  const grid = desktop ? GRID.desk : GRID.phone;
  // другое свойство — строки с размерами старого не подходят
  const setAttribute = (id: string | null) => {
    form.setFieldValue('attributeId', id);
    form.setFieldValue('rows', []);
  };

  const header = (
    <div className={cx('flex items-center justify-between', desktop && 'px-[18px] py-3.5')}>
      <span className="text-[15px] font-bold">
        <Trans>Размеры и количество</Trans>
      </span>
      <AttributePicker attributes={attributes} value={attributeId} onChange={setAttribute} caption={desktop} />
    </div>
  );
  const columns = (
    <div className={cx(grid, 'text-[12px] font-semibold text-ink-quiet', desktop ? 'pb-2' : 'mt-2')}>
      <span>{attribute?.name}</span>
      {desktop && (
        <span>
          <Trans>Артикул</Trans>
        </span>
      )}
      <span>
        <Trans>Цена</Trans>
      </span>
      <span>{desktop ? <Trans>Количество</Trans> : <Trans>Кол-во</Trans>}</span>
      {desktop && (
        <span>
          <Trans>Штрихкод</Trans>
        </span>
      )}
      <span />
    </div>
  );
  const rowClass = cx(
    grid,
    'items-center tabular-nums',
    desktop ? 'border-t border-[#f0eef7] py-2 text-[15px]' : 'py-1.5',
  );

  return (
    <form.Field name="rows" mode="array">
      {(rowsField) => {
        const rows = rowsField.state.value;
        const body =
          rows.length === 0 ? (
            // без размеров: одна строка — цена по умолчанию и количество
            <div className={rowClass}>
              <span />
              {desktop && <span className="text-[13px] text-ink-muted">{t`авто`}</span>}
              <span className={cx(FIELD, 'flex items-center text-ink-muted', !desktop && 'bg-white text-[15px]')}>
                {price ? formatPrice(Number(price)) : '—'}
              </span>
              <form.Field name="stock">
                {(field) => <QtyStepper value={field.state.value} onChange={field.handleChange} desktop={desktop} />}
              </form.Field>
              {desktop && <span />}
              <span />
            </div>
          ) : (
            rows.map((row, index) => (
              <div key={row.key} className={rowClass}>
                <span
                  className={cx(
                    'flex h-10 items-center justify-center truncate rounded-xl bg-ink-night px-1 font-bold text-white',
                    !desktop && 'text-[15px]',
                  )}
                >
                  {rowLabel(row)}
                </span>
                {desktop && (
                  <form.Field name={`rows[${index}].sku`}>
                    {(field) => (
                      <input
                        value={field.state.value}
                        maxLength={64}
                        placeholder={t`авто`}
                        aria-label={t`Артикул: ${rowLabel(row)}`}
                        onChange={(event) => field.handleChange(event.target.value)}
                        className="w-full min-w-0 bg-transparent text-[13px] outline-none placeholder:text-ink-muted"
                      />
                    )}
                  </form.Field>
                )}
                <form.Field name={`rows[${index}].price`}>
                  {(field) => (
                    <AmountInput
                      value={field.state.value}
                      fallback={price}
                      aria-label={t`Цена: ${rowLabel(row)}`}
                      onValueChange={field.handleChange}
                      className={cx(
                        FIELD,
                        'w-full min-w-0 placeholder:text-ink-muted',
                        !desktop && 'bg-white text-[15px]',
                      )}
                    />
                  )}
                </form.Field>
                <form.Field name={`rows[${index}].stock`}>
                  {(field) => (
                    <QtyStepper
                      value={field.state.value}
                      onChange={field.handleChange}
                      desktop={desktop}
                      label={rowLabel(row)}
                    />
                  )}
                </form.Field>
                {desktop && (
                  <form.Field name={`rows[${index}].barcode`}>
                    {(field) => (
                      <input
                        value={field.state.value}
                        maxLength={64}
                        placeholder={t`необязательно`}
                        aria-label={t`Штрихкод: ${rowLabel(row)}`}
                        onChange={(event) => field.handleChange(event.target.value)}
                        className={cx(FIELD, 'w-full min-w-0 border-dashed text-[13px] placeholder:text-ink-muted')}
                      />
                    )}
                  </form.Field>
                )}
                <button
                  type="button"
                  aria-label={t`Убрать размер ${rowLabel(row)}`}
                  onClick={() => void rowsField.removeValue(index)}
                  className="text-ink-muted hover:text-ink-night"
                >
                  <Icon name="close" size={16} />
                </button>
              </div>
            ))
          );
        const chips = attribute && (
          <SizeChips
            sizes={nextSizes(attribute, rows)}
            desktop={desktop}
            onAdd={(value) => rowsField.pushValue(newRow(attributeId, value))}
            className={desktop ? 'border-t border-[#f0eef7] px-[18px] py-3' : 'mt-2'}
            note={
              desktop && (
                <>
                  <span className="flex-1" />
                  <span className="self-center text-[13px] text-ink-muted">
                    <Trans>Артикул придумаем сами, если не указать</Trans>
                  </span>
                </>
              )
            }
          />
        );
        const error = <DraftErrorText error={rowsField.state.meta.errors[0]} />;

        if (desktop) {
          return (
            <div>
              <div className="overflow-hidden rounded-[20px] bg-white shadow-[0_1px_0_#eceaf5,0_6px_16px_rgba(40,30,110,.05)]">
                {header}
                {columns}
                {body}
                {chips}
              </div>
              {error}
            </div>
          );
        }
        return (
          <div className="px-4 pt-3.5">
            {header}
            {columns}
            {body}
            {chips}
            <p className="mt-2 text-[12px] text-ink-muted">
              <Trans>
                Цена у всех размеров одна — поменяйте, если отличается. Без размеров — просто укажите количество.
              </Trans>
            </p>
            {error}
          </div>
        );
      }}
    </form.Field>
  );
}
