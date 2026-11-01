import { useInfiniteQuery, useSuspenseQuery } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';
import { useUnit } from 'effector-react';

import { cartOpened } from '@/entities/cart';
import {
  isInStock,
  productPath,
  productQueryOptions,
  productsQueryOptions,
  toProductParams,
  type CatalogSearch,
} from '@/entities/product';
import { shopQueryOptions } from '@/entities/shop';
import { useIsDesktop } from '@/shared/hooks';
import { ProductView } from '@/widgets/product-view';

/**
 * Карточка товара. `search` — выбор в каталоге, с которым пришли (категория, фильтры): по нему на компьютере
 * определяем соседние товары для стрелок и возвращаем покупателя в тот же каталог.
 */
export function ProductPage({
  subdomain,
  shortId,
  search,
}: {
  subdomain: string;
  shortId: string;
  search: CatalogSearch;
}) {
  const router = useRouter();
  const desktop = useIsDesktop();
  const openCart = useUnit(cartOpened);
  const { data: product } = useSuspenseQuery(productQueryOptions(subdomain, shortId));
  const { data: shop } = useSuspenseQuery(shopQueryOptions(subdomain));

  // соседи по каталогу нужны только окну на компьютере; каталог под ним всё равно загружается
  const { data: list } = useInfiniteQuery({
    ...productsQueryOptions(subdomain, toProductParams(search)),
    enabled: desktop,
  });
  const cards = list?.pages.flatMap((page) => page.items) ?? [];
  const index = cards.findIndex((card) => card.shortId === shortId);
  const neighbour = (offset: number) => (index >= 0 ? cards[index + offset] : undefined);

  // «Назад» возвращает в каталог с прежними фильтрами и местом прокрутки; по прямой ссылке — просто в каталог
  const goBack = () => (router.history.canGoBack() ? router.history.back() : void router.navigate({ to: '/', search }));

  const goTo = (card: { slug: string; shortId: string }) =>
    void router.navigate({
      to: '/$product',
      params: { product: productPath(card) },
      search,
      replace: true,
      resetScroll: false,
    });
  const prev = neighbour(-1);
  const next = neighbour(1);

  // под закончившимся товаром — «Ещё в этой категории» (S3)
  const soldOut = !product.variants.some(isInStock);
  const categoryId = product.category?.id;
  const { data: sameCategory } = useInfiniteQuery({
    ...productsQueryOptions(subdomain, { categoryId }),
    enabled: soldOut && !!categoryId,
  });
  const related = (sameCategory?.pages.flatMap((page) => page.items) ?? [])
    .filter((card) => card.shortId !== shortId && card.stockLevel !== 'out')
    .slice(0, 6);

  return (
    <ProductView
      product={product}
      shop={shop}
      onBack={goBack}
      onOpenCart={() => openCart(subdomain)}
      onPrev={prev ? () => goTo(prev) : undefined}
      onNext={next ? () => goTo(next) : undefined}
      related={related}
    />
  );
}
