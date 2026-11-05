import { Button } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { FieldNote, PriceField, SelectField, SizesEditor, TextAreaField } from '@/features/product-form';
import { PhotoPanel } from '@/features/product-photos';
import { PageTitle } from '@/shared/ui';

import type { NewProductView } from '../../types';

/**
 * Новый товар на компьютере (макет AdminDesk2, экран 6): «Товары / Новый», заголовок с «Сохранить черновик» и
 * «Сохранить и показать»; слева фото, справа поля и белая карточка «Размеры и количество».
 */
export function DeskNewProduct({ form, photos, attributes, categories, onSave }: NewProductView) {
  const { t } = useLingui();
  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSave(true);
      }}
    >
      <div className="text-[14px] text-ink-quiet">
        <Link to="/products" className="hover:text-ink-night">
          <Trans>Товары / Новый</Trans>
        </Link>
      </div>
      <div className="mt-1.5">
        <PageTitle
          actions={
            <form.AppForm>
              <form.Subscribe selector={(state) => state.isSubmitting}>
                {(isSubmitting) => (
                  <Button
                    variant="soft"
                    size="compact"
                    className="px-[18px]!"
                    disabled={isSubmitting}
                    onClick={() => onSave(false)}
                  >
                    <Trans>Сохранить черновик</Trans>
                  </Button>
                )}
              </form.Subscribe>
              <form.SubmitButton size="compact">
                <Trans>Сохранить и показать</Trans>
              </form.SubmitButton>
            </form.AppForm>
          }
        >
          <Trans>Новый товар</Trans>
        </PageTitle>
      </div>
      {/* до 1440 включительно (max-[1441px] — «уже 1441») правая колонка рядом с фото не помещается (таблица шире
          места) — поля сверху, фото под ними (решение основателя 2026-11-05) */}
      <div className="mt-[18px] flex gap-7 max-[1441px]:flex-col-reverse">
        <PhotoPanel photos={photos} size="new" />
        <div className="flex flex-1 flex-col gap-3.5">
          <form.AppField name="name">
            {(field) => <field.TextField label={t`Название`} maxLength={200} />}
          </form.AppField>
          <div className="grid grid-cols-[1fr_200px] gap-3.5">
            <form.Field name="categoryId">
              {(field) => (
                <SelectField
                  chevron
                  label={t`Категория`}
                  value={field.state.value ?? ''}
                  options={categories}
                  onChange={(value) => field.handleChange(value || null)}
                />
              )}
            </form.Field>
            <form.Field name="price">
              {(field) => (
                <PriceField
                  label={t`Цена, ₸`}
                  note={<FieldNote>{t`для всех размеров`}</FieldNote>}
                  value={field.state.value}
                  error={field.state.meta.errors[0] as string | undefined}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>
          <form.Field name="description">
            {(field) => (
              <TextAreaField
                label={t`Описание`}
                note={<FieldNote>{t`необязательно`}</FieldNote>}
                placeholder={t`Ткань, посадка, уход — то, что спрашивают в WhatsApp`}
                value={field.state.value}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <SizesEditor form={form} attributes={attributes} desktop />
          <form.AppForm>
            <form.FormServerError />
          </form.AppForm>
        </div>
      </div>
    </form>
  );
}
