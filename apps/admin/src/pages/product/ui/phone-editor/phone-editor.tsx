import { Trans, useLingui } from '@lingui/react/macro';

import { CategoryField } from '@/widgets/category-field';
import { DeleteProduct, ExcelMark, VariantsCard, VisibilitySwitch } from '@/features/product-form';
import { PhotoStrip } from '@/features/product-photos';
import { StorefrontLink } from '@/entities/shop';
import { BackBar, SaveBar } from '@/shared/ui';

import type { ProductView } from '../../types';

/** Карточка товара на телефоне (макет AdminPhone, экран 3): фото строкой, поля, «Варианты», «Сохранить» внизу. */
export function PhoneEditor({
  product,
  photos,
  form,
  attributeName,
  storefrontPath,
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
          storefrontPath && (
            <StorefrontLink path={storefrontPath} className="text-[14px] font-bold text-iris">
              <Trans>Витрина ↗</Trans>
            </StorefrontLink>
          )
        }
      >
        {product.name}
      </BackBar>
      <PhotoStrip photos={photos} size="edit" hint={t`Первое фото — обложка. Порядок меняется перетаскиванием.`} />
      <div className="flex flex-col gap-3 px-4 pt-3.5">
        <form.AppField name="name">
          {(field) => <field.TextField label={t`Название`} note={imported('name') && <ExcelMark />} maxLength={200} />}
        </form.AppField>
        <form.Field name="categoryId">
          {(field) => (
            <CategoryField
              label={t`Категория`}
              note={imported('category') && <ExcelMark />}
              value={field.state.value ?? null}
              onChange={field.handleChange}
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
