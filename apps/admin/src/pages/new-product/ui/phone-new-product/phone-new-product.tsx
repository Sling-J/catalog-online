import { Button } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';

import { PhotoStrip, PriceField, SaveBar, SelectField, SizesEditor } from '@/features/product-form';
import { BackBar } from '@/shared/ui';

import type { NewProductView } from '../../types';

/** Новый товар на телефоне (макет AdminPhone2, экран 7): фото, название, категория и цена, размеры. */
export function PhoneNewProduct({ form, attributes, categories, onSave }: NewProductView) {
  const { t } = useLingui();
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSave(true);
      }}
    >
      <BackBar to="/products">
        <Trans>Новый товар</Trans>
      </BackBar>
      <PhotoStrip photos={[]} size="new" />
      {/* у строки фото 3 px снизу под рамку обложки — до полей 14 px, как в макете */}
      <div className="flex flex-col gap-3 px-4 pt-[11px]">
        <form.AppField name="name">{(field) => <field.TextField label={t`Название`} maxLength={200} />}</form.AppField>
        <div className="flex gap-2">
          <form.Field name="categoryId">
            {(field) => (
              <SelectField
                chevron
                label={t`Категория`}
                value={field.state.value ?? ''}
                options={categories}
                onChange={(value) => field.handleChange(value || null)}
                className="min-w-0 flex-1"
              />
            )}
          </form.Field>
          <form.Field name="price">
            {(field) => (
              <PriceField
                label={t`Цена, ₸`}
                value={field.state.value}
                error={field.state.meta.errors[0] as string | undefined}
                onChange={field.handleChange}
                className="w-[120px] flex-none"
              />
            )}
          </form.Field>
        </div>
      </div>
      <SizesEditor form={form} attributes={attributes} desktop={false} />
      <form.AppForm>
        <form.FormServerError />
        <SaveBar>
          <div className="flex gap-2.5">
            <form.Subscribe selector={(state) => state.isSubmitting}>
              {(isSubmitting) => (
                <Button
                  variant="soft"
                  size="form"
                  className="flex-none"
                  disabled={isSubmitting}
                  onClick={() => onSave(false)}
                >
                  <Trans>Черновик</Trans>
                </Button>
              )}
            </form.Subscribe>
            <form.SubmitButton size="form" className="flex-1">
              <Trans>Сохранить и показать</Trans>
            </form.SubmitButton>
          </div>
        </SaveBar>
      </form.AppForm>
    </form>
  );
}
