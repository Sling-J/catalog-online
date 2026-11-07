import { useIsDesktop } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { newProductDraft, useCreateProduct, useDraftMessages, useProductForm } from '@/features/product-form';
import { PhotosNotUploadedError, useNewProductPhotos } from '@/features/product-photos';
import { attributesQueryOptions } from '@/entities/attribute';
import { categoriesQueryOptions, flattenCategories } from '@/entities/category';
import { fieldErrors } from '@/shared/api';
import { useFormMessages, useLeaveGuard } from '@/shared/hooks';
import { LeaveConfirm, setFormError, setServerError, submitForm, useIsDirty } from '@/shared/ui';

import type { NewProductView } from '../types';

import { DeskNewProduct } from './desk-new-product';
import { PhoneNewProduct } from './phone-new-product';

/**
 * Новый товар вручную (FR-A5): телефон — макет AdminPhone2, экран 7; компьютер — AdminDesk2, экран 6.
 * Размеры чипами, цена одна на все размеры, количество «− N +». «Черновик» сохраняет товар скрытым,
 * «Сохранить и показать» — сразу на витрину; затем — обратно в «Товары», новый товар там первым. Уход с начатой
 * карточкой спрашивает подтверждение.
 */
export function NewProductPage() {
  const { t } = useLingui();
  const messages = useFormMessages();
  const draftMessage = useDraftMessages();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const { data: attributes } = useSuspenseQuery(attributesQueryOptions());
  const create = useCreateProduct();
  const photos = useNewProductPhotos();
  // исходные значения — один раз: свежий объект на каждой отрисовке форма приняла бы за новые
  const [defaultValues] = useState(() => newProductDraft(attributes));
  const form = useProductForm({
    defaultValues,
    onSubmit: async (draft, { visible }, formApi) => {
      try {
        // загружаемые фото дожидаемся; не загрузилось — товар не сохраняем, ошибка под фото
        const photoUploadIds = await photos.uploadIds();
        await create.mutateAsync({ draft, visible, photoUploadIds });
        guard.allow();
        await navigate({ to: '/products' });
      } catch (error) {
        if (error instanceof PhotosNotUploadedError)
          setFormError(formApi, t`Не все фото загрузились — повторите или удалите их`);
        else if (fieldErrors(error).name) setServerError(formApi, 'name', draftMessage('required'));
        else setFormError(formApi, messages.failed);
      }
    },
  });
  // загруженные фото пропадут при уходе так же, как поля
  const guard = useLeaveGuard(useIsDirty(form) || photos.tiles.length > 0);

  const view: NewProductView = {
    form,
    photos,
    attributes,
    categories: [
      { value: '', label: t`Без категории` },
      ...flattenCategories(tree).map((category) => ({
        value: category.id,
        label: `${' '.repeat(category.depth * 3)}${category.name}`,
      })),
    ],
    onSave: (visible) => void submitForm(form, { visible }),
  };
  return (
    <>
      {isDesktop ? <DeskNewProduct {...view} /> : <PhoneNewProduct {...view} />}
      <LeaveConfirm guard={guard} text={<Trans>Правки в карточке пропадут.</Trans>} />
    </>
  );
}
