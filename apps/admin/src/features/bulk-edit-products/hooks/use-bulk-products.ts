import type { Category } from '@catalog/contract';
import { bulkUpdateProductsMutation } from '@catalog/contract/query';
import { plural } from '@lingui/core/macro';
import { useLingui } from '@lingui/react/macro';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { categoriesQueryOptions, flattenCategories } from '@/entities/category';
import { invalidateProducts } from '@/entities/product';

export type BulkAction = { action: 'hide' | 'show' } | { action: 'set_category'; categoryId: string | null };

/**
 * Массовое действие над выбранными товарами (полоса на компьютере, панель на телефоне). После успеха — `onDone`
 * с текстом сообщения («3 товара перенесены в «Кофты»», доска AdminProductsStates, экран 9).
 */
export function useBulkProducts(productIds: string[], onDone: (message: string) => void) {
  const { t } = useLingui();
  const queryClient = useQueryClient();

  const messageOf = (action: BulkAction, count: number): string => {
    if (action.action === 'hide') {
      return plural(count, { one: '# товар скрыт', few: '# товара скрыты', other: '# товаров скрыты' });
    }
    if (action.action === 'show') {
      return plural(count, {
        one: '# товар показан на витрине',
        few: '# товара показаны на витрине',
        other: '# товаров показаны на витрине',
      });
    }
    const tree = queryClient.getQueryData<Category[]>(categoriesQueryOptions().queryKey) ?? [];
    const name =
      flattenCategories(tree).find((item) => 'categoryId' in action && item.id === action.categoryId)?.name ??
      t`Без категории`;
    return plural(count, {
      one: `# товар перенесён в «${name}»`,
      few: `# товара перенесены в «${name}»`,
      other: `# товаров перенесены в «${name}»`,
    });
  };

  const bulk = useMutation({
    ...bulkUpdateProductsMutation(),
    onSettled: () => invalidateProducts(queryClient),
  });

  const run = (action: BulkAction) =>
    bulk.mutate(
      { body: { productIds, ...action } },
      { onSuccess: ({ updated }) => onDone(messageOf(action, updated)) },
    );

  return { run, pending: bulk.isPending };
}
