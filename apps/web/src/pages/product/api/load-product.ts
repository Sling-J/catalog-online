import type { QueryClient } from '@tanstack/react-query';
import { notFound, redirect } from '@tanstack/react-router';

import { parseProductPath, productPath, productQueryOptions } from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { throwFirstFailure, type NotFoundData } from '@/shared/api';

/**
 * Предзагрузка карточки товара. Адрес — `<slug>-<shortId>`: ищем по shortId, а если slug в адресе устарел
 * (товар переименовали), отвечаем 301 на актуальный адрес, чтобы старые ссылки не умирали.
 * Нет товара — «не найден» с причиной `product` (магазин при этом есть), скрытый магазин — его заглушка.
 * Возвращает shortId для страницы.
 */
export async function loadProduct(queryClient: QueryClient, subdomain: string, path: string): Promise<string> {
  const parsed = parseProductPath(path);
  if (!parsed) throw notFound({ data: { reason: 'product' } satisfies NotFoundData });
  const [product, shop] = await Promise.allSettled([
    queryClient.ensureQueryData(productQueryOptions(subdomain, parsed.shortId)),
    queryClient.ensureQueryData(shopQueryOptions(subdomain)),
  ]);
  // 404 магазина — «магазин не найден», 404 товара — «такого товара нет»
  throwFirstFailure([shop], undefined);
  throwFirstFailure([product], 'product');
  if (product.status === 'fulfilled' && product.value.slug !== parsed.slug) {
    throw redirect({
      to: '/$product',
      params: { product: productPath(product.value) },
      statusCode: 301,
      replace: true,
    });
  }
  return parsed.shortId;
}
