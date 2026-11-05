import type { AnyFormApi } from '@tanstack/react-form';

import { invalidFields, useAppForm } from '@/shared/ui';

import { validateDraft } from '../lib';
import type { ProductDraft } from '../types';
import { useDraftMessages } from './use-draft-messages';

/** Что нажали: «Черновик» (скрытым) или «Сохранить» / «Сохранить и показать». */
export type ProductSubmitMeta = { visible: boolean };

/**
 * Форма товара на TanStack Form (ADR 0003): значения — черновик (`ProductDraft`), проверка при отправке — та же
 * `validateDraft`; ошибки у полей «Название», «Цена, ₸» и у таблицы размеров (`rows`).
 */
export function useProductForm({
  defaultValues,
  onSubmit,
}: {
  defaultValues: ProductDraft;
  onSubmit: (draft: ProductDraft, meta: ProductSubmitMeta, form: AnyFormApi) => Promise<void>;
}) {
  const message = useDraftMessages();
  return useAppForm({
    defaultValues,
    onSubmitMeta: { visible: true } as ProductSubmitMeta,
    validators: {
      onSubmit: ({ value }) => {
        const errors = validateDraft(value);
        return invalidFields({
          name: message(errors.name),
          price: message(errors.price),
          rows: message(errors.variants),
        });
      },
    },
    onSubmit: ({ value, meta, formApi }) => onSubmit(value, meta, formApi),
  });
}

export type ProductForm = ReturnType<typeof useProductForm>;
