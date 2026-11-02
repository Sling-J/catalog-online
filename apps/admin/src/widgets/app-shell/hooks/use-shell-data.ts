import { useSuspenseQuery } from '@tanstack/react-query';

import { productCountsQueryOptions } from '@/entities/product';
import { shopQueryOptions, storefrontUrl } from '@/entities/shop';

/** Магазин, адрес его витрины (если адрес уже выбран в мастере) и число товаров для меню. */
export function useShellData() {
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const { data: counts } = useSuspenseQuery(productCountsQueryOptions());
  return {
    shop,
    productCount: counts.all,
    url: shop.subdomain ? storefrontUrl(shop.subdomain, window.location.origin) : null,
  };
}
