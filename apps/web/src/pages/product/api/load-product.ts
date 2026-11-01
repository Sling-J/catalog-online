import type { QueryClient } from '@tanstack/react-query';
import { notFound, redirect } from '@tanstack/react-router';

import { parseProductPath, productPath, productQueryOptions } from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { isNotFoundError } from '@/shared/api';

/**
 * Предзагрузка карточки товара. Адрес — `<slug>-<shortId>`: ищем по shortId, а если slug в адресе устарел
 * (товар переименовали), отвечаем 301 на актуальный адрес, чтобы старые ссылки не умирали.
 * Возвращает shortId для страницы.
 */
export async function loadProduct(queryClient: QueryClient, subdomain: string, path: string): Promise<string> {
  const parsed = parseProductPath(path);
  if (!parsed) throw notFound();
  try {
    const [product] = await Promise.all([
      queryClient.ensureQueryData(productQueryOptions(subdomain, parsed.shortId)),
      queryClient.ensureQueryData(shopQueryOptions(subdomain)),
    ]);
    if (product.slug !== parsed.slug) {
      throw redirect({ to: '/$product', params: { product: productPath(product) }, statusCode: 301, replace: true });
    }
  } catch (error) {
    if (isNotFoundError(error)) throw notFound();
    throw error;
  }
  return parsed.shortId;
}
