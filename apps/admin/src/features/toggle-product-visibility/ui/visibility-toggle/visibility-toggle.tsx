import type { ListProductsResponse, ProductListItem } from '@catalog/contract';
import { updateProductMutation } from '@catalog/contract/query';
import { Switch } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { type InfiniteData, useMutation, useQueryClient } from '@tanstack/react-query';

import { invalidateProducts } from '@/entities/product';

const LISTS = [{ _id: 'listProducts' }];

/**
 * «Витрина» в строке таблицы (макет AdminDesk, экран 1): показать или скрыть товар на витрине.
 * Переключается сразу, без ожидания ответа; не получилось — возвращается обратно.
 */
export function VisibilityToggle({ product }: { product: ProductListItem }) {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const setVisible = (isVisible: boolean) =>
    queryClient.setQueriesData<InfiniteData<ListProductsResponse>>({ queryKey: LISTS }, (data) =>
      data
        ? {
            ...data,
            pages: data.pages.map((page) => ({
              ...page,
              items: page.items.map((item) => (item.id === product.id ? { ...item, isVisible } : item)),
            })),
          }
        : data,
    );
  const update = useMutation({
    ...updateProductMutation(),
    onMutate: ({ body }) => setVisible(body?.isVisible ?? product.isVisible),
    onError: () => setVisible(product.isVisible),
    onSettled: () => invalidateProducts(queryClient),
  });

  return (
    <Switch
      checked={product.isVisible}
      onCheckedChange={(isVisible) => update.mutate({ path: { productId: product.id }, body: { isVisible } })}
      label={<span className="sr-only">{t`Показывать на витрине: ${product.name}`}</span>}
      className="w-auto gap-0"
    />
  );
}
