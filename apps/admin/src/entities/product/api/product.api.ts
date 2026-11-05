import type { Product } from '@catalog/contract';
import { getProductOptions, getProductQueryKey } from '@catalog/contract/query';
import type { QueryClient } from '@tanstack/react-query';

/** Товар с вариантами и фото — для редактора (FR-A5). */
export const productQueryOptions = (productId: string) => getProductOptions({ path: { productId } });

/** Товар после сохранения — сразу в кеш редактора, без повторного запроса. */
export function applyProduct(queryClient: QueryClient, product: Product): void {
  queryClient.setQueryData(getProductQueryKey({ path: { productId: product.id } }), product);
}
