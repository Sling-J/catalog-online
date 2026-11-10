import { Button, Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import {
  canTakeFromExcel,
  DeleteProduct,
  ExcelNote,
  ImportNote,
  VariantsTable,
  VisibilitySwitch,
} from '@/features/product-form';
import { CategoryField } from '@/widgets/category-field';
import { PhotoPanel } from '@/features/product-photos';
import { StorefrontLink } from '@/entities/shop';
import { FieldNote, PageTitle, TextAreaField } from '@/shared/ui';

import type { ProductView } from '../../types';

/**
 * Карточка товара на компьютере (макет AdminDesk, экран 2): «Товары / Категория», заголовок с «На витрине»,
 * «Отменить» и «Сохранить»; слева фото, справа поля, пояснение про «из Excel» и таблица вариантов.
 */
export function DeskEditor({
  product,
  photos,
  form,
  category,
  attributeName,
  storefrontPath,
  onCancel,
  onDeleted,
  onSubmit,
}: ProductView) {
  const { t } = useLingui();
  const imported = (field: 'name' | 'category' | 'variants') => product.importedFields.includes(field);
  const fromExcel = canTakeFromExcel(product);
  return (
    <form noValidate onSubmit={onSubmit}>
      <div className="text-[14px] text-ink-quiet">
        <Link to="/products" className="hover:text-ink-night">
          {category ? <Trans>Товары / {category}</Trans> : <Trans>Товары</Trans>}
        </Link>
      </div>
      <div className="mt-1.5">
        <PageTitle
          actions={
            <>
              {storefrontPath && (
                <StorefrontLink
                  path={storefrontPath}
                  className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-iris"
                >
                  <Icon name="eye" size={16} />
                  <Trans>На витрине</Trans>
                </StorefrontLink>
              )}
              <Button variant="soft" size="compact" className="px-[18px]!" onClick={onCancel}>
                <Trans>Отменить</Trans>
              </Button>
              <form.AppForm>
                <form.SubmitButton size="compact">
                  <Trans>Сохранить</Trans>
                </form.SubmitButton>
              </form.AppForm>
            </>
          }
        >
          {product.name}
        </PageTitle>
      </div>
      {/* до 1440 включительно (max-[1441px] — «уже 1441») правая колонка рядом с фото не помещается (таблица шире места) — поля сверху, фото
          под ними (решение основателя 2026-11-05) */}
      <div className="mt-[18px] flex gap-7 max-[1441px]:flex-col-reverse">
        <PhotoPanel photos={photos} size="edit" />
        <div className="flex flex-1 flex-col gap-3.5">
          <div className="grid grid-cols-2 gap-3.5">
            <form.AppField name="name">
              {(field) => (
                <field.TextField
                  label={t`Название`}
                  note={<ExcelNote form={form} field="name" available={fromExcel} />}
                  maxLength={200}
                />
              )}
            </form.AppField>
            <form.Field name="categoryId">
              {(field) => (
                <CategoryField
                  label={t`Категория`}
                  note={<ExcelNote form={form} field="category" available={fromExcel} />}
                  value={field.state.value ?? null}
                  onChange={field.handleChange}
                />
              )}
            </form.Field>
          </div>
          <form.Field name="description">
            {(field) => (
              <TextAreaField
                label={t`Описание`}
                note={
                  <FieldNote>
                    {product.importedFields.length > 0 ? t`правится только здесь` : t`необязательно`}
                  </FieldNote>
                }
                value={field.state.value}
                onChange={field.handleChange}
              />
            )}
          </form.Field>
          <form.Field name="isVisible">
            {(field) => <VisibilitySwitch card checked={field.state.value} onChange={field.handleChange} />}
          </form.Field>
          {product.importedFields.length > 0 && <ImportNote />}
          <VariantsTable form={form} attributeName={attributeName} imported={imported('variants')} />
          <form.AppForm>
            <form.FormServerError />
          </form.AppForm>
          <DeleteProduct product={product} onDeleted={onDeleted} className="pt-1" />
        </div>
      </div>
    </form>
  );
}
