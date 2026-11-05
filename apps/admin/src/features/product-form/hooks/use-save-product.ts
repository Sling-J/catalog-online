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
      if (Object.keys(changes).length > 0)
        saved = (await updateProduct({ path, body: changes, throwOnError: true })).data;
      if (variantsChanged(product, draft)) {
        const body = { variants: toVariantInputs(draft) };
        saved = (await replaceProductVariants({ path, body, throwOnError: true })).data;
      }
      return saved;
    },
    onSuccess: (saved) => {
      applyProduct(queryClient, saved);
      return invalidateProducts(queryClient);
    },
  });
}

/** Новый товар вручную; «Черновик» — скрытым (`isVisible: false`). */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ draft, visible }: { draft: ProductDraft; visible: boolean }) => {
      const { data } = await createProduct({
        throwOnError: true,
        body: {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          categoryId: draft.categoryId,
          isVisible: visible,
          variants: toVariantInputs(draft),
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
