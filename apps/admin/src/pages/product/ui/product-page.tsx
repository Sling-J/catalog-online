import { useIsDesktop } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { draftFromProduct, useDraftMessages, useProductForm, useSaveProduct } from '@/features/product-form';
import { useProductPhotos } from '@/features/product-photos';
import { attributesQueryOptions } from '@/entities/attribute';
import { categoriesQueryOptions, flattenCategories } from '@/entities/category';
import { productQueryOptions } from '@/entities/product';
import { shopQueryOptions, storefrontUrl } from '@/entities/shop';
import { fieldErrors } from '@/shared/api';
import { useFormMessages, useLeaveGuard } from '@/shared/hooks';
import { LeaveConfirm, setFormError, setServerError, submitForm, useIsDirty } from '@/shared/ui';

import type { ProductView } from '../types';

import { DeskEditor } from './desk-editor';
import { PhoneEditor } from './phone-editor';

/**
 * Карточка товара (FR-A5): телефон — макет AdminPhone, экран 3; компьютер — AdminDesk, экран 2.
 * Поля, которые перезапишет импорт, помечены «из Excel». Сохранили или удалили — обратно в «Товары»; уход с
 * несохранёнными правками спрашивает подтверждение.
 */
export function ProductPage({ productId }: { productId: string }) {
  const { t } = useLingui();
  const messages = useFormMessages();
  const draftMessage = useDraftMessages();
  const isDesktop = useIsDesktop();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: product } = useSuspenseQuery(productQueryOptions(productId));
  const { data: tree } = useSuspenseQuery(categoriesQueryOptions());
  const { data: attributes } = useSuspenseQuery(attributesQueryOptions());
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const save = useSaveProduct(product);
  // исходные значения — один раз: свежий объект на каждой отрисовке форма приняла бы за новые
  const [defaultValues] = useState(() => draftFromProduct(product));
  const form = useProductForm({
    defaultValues,
    onSubmit: async (draft, _meta, formApi) => {
      try {
        await save.mutateAsync(draft);
        await toList();
      } catch (error) {
        if (fieldErrors(error).name) setServerError(formApi, 'name', draftMessage('required'));
        else setFormError(formApi, messages.failed);
      }
    },
  });
  const photos = useProductPhotos(product);
  // фото сохраняются сразу, но загружаемое ещё не прикреплено — уход его потеряет
  const guard = useLeaveGuard(useIsDirty(form) || photos.busy);
  const toList = () => {
    guard.allow();
    return navigate({ to: '/products' });
  };

  const categories = [
    { value: '', label: t`Без категории` },
    ...flattenCategories(tree).map((category) => ({
      value: category.id,
      label: `${' '.repeat(category.depth * 3)}${category.name}`,
    })),
  ];
  const view: ProductView = {
    product,
    photos,
    form,
    categories,
    category: flattenCategories(tree).find((category) => category.id === product.categoryId)?.name,
    attributeName: attributes.find((attribute) => attribute.id === defaultValues.attributeId)?.name,
    storefrontLink: shop.subdomain
      ? `${storefrontUrl(shop.subdomain, window.location.origin)}/${product.slug}-${product.shortId}`
      : undefined,
    onCancel: () => void navigate({ to: '/products' }),
    // удалённый товар убираем из кеша, когда с его страницы уже ушли
    onDeleted: () =>
      void toList().then(() => queryClient.removeQueries({ queryKey: productQueryOptions(productId).queryKey })),
    onSubmit: (event) => {
      event.preventDefault();
      void submitForm(form);
    },
  };
  return (
    <>
      {isDesktop ? <DeskEditor {...view} /> : <PhoneEditor {...view} />}
      <LeaveConfirm guard={guard} text={<Trans>Правки в карточке пропадут.</Trans>} />
    </>
  );
}
