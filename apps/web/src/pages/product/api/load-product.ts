import type { I18n } from '@lingui/core';
import type { QueryClient } from '@tanstack/react-query';
import { notFound, redirect } from '@tanstack/react-router';

import { parseProductPath, productPath, productQueryOptions } from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { throwFirstFailure, type NotFoundData } from '@/shared/api';
import { getSiteOrigin, type PageHead } from '@/shared/lib';

import { productHead } from './product-head';

/**
 * Предзагрузка карточки товара. Адрес — `<slug>-<shortId>`: ищем по shortId, а если slug в адресе устарел
 * (товар переименовали), отвечаем 301 на актуальный адрес, чтобы старые ссылки не умирали.
 * Нет товара — «не найден» с причиной `product` (магазин при этом есть), скрытый магазин — его заглушка.
 * Возвращает shortId для страницы и её заголовок с превью ссылки.
 */
export async function loadProduct(
  queryClient: QueryClient,
  subdomain: string,
  path: string,
  i18n: I18n,
): Promise<{ shortId: string; head: PageHead }> {
  const parsed = parseProductPath(path);
  if (!parsed) throw notFound({ data: { reason: 'product' } satisfies NotFoundData });
  const [product, shop] = await Promise.allSettled([
    queryClient.ensureQueryData(productQueryOptions(subdomain, parsed.shortId)),
    queryClient.ensureQueryData(shopQueryOptions(subdomain)),
  ]);
  // 404 магазина — «магазин не найден», 404 товара — «такого товара нет»
  throwFirstFailure([shop], undefined);
  throwFirstFailure([product], 'product');
  if (product.status !== 'fulfilled' || shop.status !== 'fulfilled') throw new Error('unreachable');
  if (product.value.slug !== parsed.slug) {
    throw redirect({
      to: '/$product',
      params: { product: productPath(product.value) },
      statusCode: 301,
      replace: true,
    });
  }
  return {
    shortId: parsed.shortId,
    head: productHead({ i18n, origin: getSiteOrigin(), shop: shop.value, product: product.value }),
  };
}
