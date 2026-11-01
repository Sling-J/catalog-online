import { useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

import { productQueryOptions } from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { ProductView } from '@/widgets/product-view';

export function ProductPage({ subdomain, shortId }: { subdomain: string; shortId: string }) {
  const router = useRouter();
  const { data: product } = useSuspenseQuery(productQueryOptions(subdomain, shortId));
  const { data: shop } = useSuspenseQuery(shopQueryOptions(subdomain));

  // «Назад» возвращает в каталог с прежними фильтрами и местом прокрутки; по прямой ссылке — просто в каталог
  const goBack = () => (router.history.canGoBack() ? router.history.back() : void router.navigate({ to: '/' }));

  return (
    <ProductView
      product={product}
      shop={shop}
      onBack={goBack}
      // шторка корзины — T-107
      onOpenCart={() => {}}
    />
  );
}
