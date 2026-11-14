import { createProduct, deleteProduct, type Product, replaceProductVariants, updateProduct } from '@catalog/contract';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { applyProduct, invalidateProducts } from '@/entities/product';

import { productChanges, toVariantInputs, variantsChanged } from '../lib';
import type { ProductDraft } from '../types';

/** Сохранить правки товара: карточку (PATCH) и таблицу размеров (PUT целиком) — только то, что изменилось. */
export function useSaveProduct(product: Product) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (draft: ProductDraft) => {
      const path = { productId: product.id };
      let saved = product;
      const changes = productChanges(product, draft);
      const variants = variantsChanged(product, draft);
      if (Object.keys(changes).length > 0)
        saved = (await updateProduct({ path, body: changes, throwOnError: true })).data;
      if (variants) {
        const body = { variants: toVariantInputs(draft) };
        saved = (await replaceProductVariants({ path, body, throwOnError: true })).data;
      }
      // счётчики и чек-лист зависят от видимости и вариантов (остатки, их число), не от текста карточки
      return { saved, counts: variants || 'isVisible' in changes };
    },
    onSuccess: ({ saved, counts }) => {
      applyProduct(queryClient, saved);
      return invalidateProducts(queryClient, { counts });
    },
  });
}

/** Новый товар вручную; «Черновик» — скрытым (`isVisible: false`); фото — уже загруженные, по порядку. */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      draft,
      visible,
      photoUploadIds,
    }: {
      draft: ProductDraft;
      visible: boolean;
      photoUploadIds: string[];
    }) => {
      const { data } = await createProduct({
        throwOnError: true,
        body: {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          categoryId: draft.categoryId,
          isVisible: visible,
          variants: toVariantInputs(draft),
          photoUploadIds,
        },
      });
      return data;
    },
    onSuccess: (saved) => {
      applyProduct(queryClient, saved);
      return invalidateProducts(queryClient);
    },
  });
}

/** Удалить товар вместе с вариантами и фото; списки и счётчики перечитываются. */
export function useDeleteProduct(product: Product) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await deleteProduct({ path: { productId: product.id }, throwOnError: true });
    },
    onSuccess: () => invalidateProducts(queryClient),
  });
}
