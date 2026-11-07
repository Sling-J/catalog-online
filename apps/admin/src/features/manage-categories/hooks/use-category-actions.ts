import type { Category } from '@catalog/contract';
import {
  createCategoryMutation,
  deleteCategoryMutation,
  renameCategoryMutation,
  reorderCategoriesMutation,
} from '@catalog/contract/query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { categoriesQueryOptions, type CategoryGroups, orderFromGroups, treeFromGroups } from '@/entities/category';
import { invalidateProducts } from '@/entities/product';

/**
 * Правки категорий (FR-A6): создать, переименовать, перенести, удалить, порядок перетаскиванием. Каждая правка
 * сохраняется сразу. Порядок показывается до ответа сервера; не сохранился — возвращается прежний и `orderFailed`.
 * После правок перечитываются дерево и списки товаров (в строке товара — название категории).
 */
export function useCategoryActions() {
  const queryClient = useQueryClient();
  const key = categoriesQueryOptions().queryKey;
  const [orderFailed, setOrderFailed] = useState(false);
  const refresh = () =>
    Promise.all([queryClient.invalidateQueries({ queryKey: key }), invalidateProducts(queryClient)]).then(
      () => undefined,
    );

  const create = useMutation({ ...createCategoryMutation(), onSuccess: refresh });
  const rename = useMutation({ ...renameCategoryMutation(), onSuccess: refresh });
  const remove = useMutation({ ...deleteCategoryMutation(), onSuccess: refresh });
  const reorder = useMutation({
    ...reorderCategoriesMutation(),
    onSuccess: (tree) => {
      queryClient.setQueryData(key, tree);
      return invalidateProducts(queryClient);
    },
  });

  /** Новый порядок групп: сразу на экране, затем на сервер. */
  const saveOrder = (groups: CategoryGroups) => {
    const before = queryClient.getQueryData<Category[]>(key) ?? [];
    setOrderFailed(false);
    queryClient.setQueryData(key, treeFromGroups(before, groups));
    reorder.mutate(
      { body: { items: orderFromGroups(groups) } },
      {
        onError: () => {
          queryClient.setQueryData(key, before);
          setOrderFailed(true);
        },
      },
    );
  };

  return {
    create: (name: string, parentId: string | null) => create.mutateAsync({ body: { name, parentId } }),
    rename: (categoryId: string, name: string) => rename.mutateAsync({ path: { categoryId }, body: { name } }),
    /** Перенос из шторки: ждём ответа, ошибку покажет шторка. */
    move: (groups: CategoryGroups) => reorder.mutateAsync({ body: { items: orderFromGroups(groups) } }),
    remove,
    saveOrder,
    orderFailed,
  };
}

export type CategoryActions = ReturnType<typeof useCategoryActions>;
