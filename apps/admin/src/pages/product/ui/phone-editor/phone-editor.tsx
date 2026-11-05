import { Trans, useLingui } from '@lingui/react/macro';

import {
  DeleteProduct,
  ExcelMark,
  PhotoStrip,
  SaveBar,
  SelectField,
  VariantsCard,
  VisibilitySwitch,
} from '@/features/product-form';
import { BackBar } from '@/shared/ui';

import type { ProductView } from '../../types';

/** Карточка товара на телефоне (макет AdminPhone, экран 3): фото строкой, поля, «Варианты», «Сохранить» внизу. */
export function PhoneEditor({
  product,
  form,
  categories,
  attributeName,
  storefrontLink,
  onDeleted,
  onSubmit,
}: ProductView) {
  const { t } = useLingui();
  const imported = (field: 'name' | 'category' | 'variants') => product.importedFields.includes(field);
  return (
    <form noValidate onSubmit={onSubmit}>
      <BackBar
        to="/products"
        action={
          storefrontLink && (
            <a href={storefrontLink} target="_blank" rel="noreferrer" className="text-[14px] font-bold text-iris">
              <Trans>Витрина ↗</Trans>
            </a>
          )
        }
      >
        {product.name}
      </BackBar>
      <PhotoStrip photos={product.photos} size="edit" />
      <p className="px-4 pt-[3px] text-[12px] text-ink-muted">
        <Trans>Первое фото — обложка. Порядок меняется перетаскиванием.</Trans>
      </p>
      <div className="flex flex-col gap-3 px-4 pt-3.5">
        <form.AppField name="name">
          {(field) => <field.TextField label={t`Название`} note={imported('name') && <ExcelMark />} maxLength={200} />}
        </form.AppField>
        <form.Field name="categoryId">
          {(field) => (
            <SelectField
              label={t`Категория`}
              note={imported('category') && <ExcelMark />}
              value={field.state.value ?? ''}
              options={categories}
              onChange={(value) => field.handleChange(value || null)}
            />
          )}
        </form.Field>
        <form.Field name="isVisible">
          {(field) => <VisibilitySwitch checked={field.state.value} onChange={field.handleChange} />}
        </form.Field>
      </div>
      <VariantsCard form={form} attributeName={attributeName} imported={imported('variants')} />
      <DeleteProduct product={product} onDeleted={onDeleted} className="px-4 pt-5" />
      <form.AppForm>
        <form.FormServerError />
        <SaveBar>
          <form.SubmitButton size="form" block>
            <Trans>Сохранить</Trans>
          </form.SubmitButton>
        </SaveBar>
      </form.AppForm>
    </form>
  );
}
