import type { Attribute } from '@catalog/contract';
import {
  createAttributeMutation,
  deleteAttributeMutation,
  replaceAttributeValuesMutation,
  updateAttributeMutation,
} from '@catalog/contract/query';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { attributesQueryOptions } from '@/entities/attribute';
import { invalidateProducts } from '@/entities/product';

type ValueInput = { id?: string; value: string };

/**
 * Правки свойств (FR-A6): создать, переименовать, «в фильтрах», удалить; значения — добавить, переименовать,
 * удалить, порядок. Всё сохраняется сразу. «В фильтрах» и порядок значений видны до ответа сервера; не сохранилось —
 * возвращается прежнее и `failed`. Имена свойств и значений стоят в вариантах — после правок перечитываем и товары.
 */
export function useAttributeActions() {
  const queryClient = useQueryClient();
  const key = attributesQueryOptions().queryKey;
  const [failed, setFailed] = useState(false);

  const refreshProducts = () =>
    Promise.all([
      invalidateProducts(queryClient),
      queryClient.invalidateQueries({ queryKey: [{ _id: 'getProduct' }] }),
    ]).then(() => undefined);
  const put = (attribute: Attribute) =>
    queryClient.setQueryData<Attribute[]>(key, (list) =>
      list?.map((item) => (item.id === attribute.id ? attribute : item)),
    );

  const create = useMutation({
    ...createAttributeMutation(),
    onSuccess: (attribute) => queryClient.setQueryData<Attribute[]>(key, (list) => [...(list ?? []), attribute]),
  });
  const update = useMutation({
    ...updateAttributeMutation(),
    onSuccess: (attribute) => {
      put(attribute);
      return refreshProducts();
    },
  });
  const remove = useMutation({
    ...deleteAttributeMutation(),
    onSuccess: () => Promise.all([queryClient.invalidateQueries({ queryKey: key }), refreshProducts()]),
  });
  const values = useMutation({
    ...replaceAttributeValuesMutation(),
    onSuccess: (attribute) => {
      put(attribute);
      return refreshProducts();
    },
  });

  /** Правка, которую показываем сразу: не сохранилась — откат и сообщение. */
  const optimistic = (next: Attribute, save: () => Promise<unknown>) => {
    const before = queryClient.getQueryData<Attribute[]>(key);
    setFailed(false);
    put(next);
    save().catch(() => {
      queryClient.setQueryData(key, before);
      setFailed(true);
    });
  };

  return {
    create: (body: { name: string; inFilters: boolean; values: string[] }) => create.mutateAsync({ body }),
    rename: (attribute: Attribute, name: string) =>
      update.mutateAsync({ path: { attributeId: attribute.id }, body: { name } }),
    setInFilters: (attribute: Attribute, inFilters: boolean) =>
      optimistic({ ...attribute, inFilters }, () =>
        update.mutateAsync({ path: { attributeId: attribute.id }, body: { inFilters } }),
      ),
    /** Значения целиком: ждём ответа, ошибку покажет тот, кто правит. */
    saveValues: (attribute: Attribute, list: ValueInput[]) =>
      values.mutateAsync({ path: { attributeId: attribute.id }, body: { values: list } }),
    reorderValues: (attribute: Attribute, ids: string[]) => {
      const byId = new Map(attribute.values.map((entry) => [entry.id, entry]));
      const ordered = ids.flatMap((id, position) => {
        const entry = byId.get(id);
        return entry ? [{ ...entry, position }] : [];
      });
      optimistic({ ...attribute, values: ordered }, () =>
        values.mutateAsync({
          path: { attributeId: attribute.id },
          body: { values: ordered.map(({ id, value }) => ({ id, value })) },
        }),
      );
    },
    remove,
    failed,
  };
}

export type AttributeActions = ReturnType<typeof useAttributeActions>;
