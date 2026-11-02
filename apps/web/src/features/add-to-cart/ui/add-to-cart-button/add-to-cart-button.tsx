import type { StorefrontProduct } from '@catalog/contract';
import { Button, formatPrice } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useUnit } from 'effector-react';

import { $items, variantAdded } from '@/entities/cart';
import { isInStock } from '@/entities/product';
import { buildCartItem } from '@/features/add-to-cart/lib';

/**
 * Главная кнопка карточки товара. Жёлтая «В корзину · цена» — только при выбранном варианте в наличии;
 * после добавления мятная «В корзине · открыть» (одна жёлтая кнопка на экран).
 */
export function AddToCartButton({
  product,
  variant,
  onOpenCart,
}: {
  product: StorefrontProduct;
  /** Выбранный вариант; `undefined`, пока выбрано не всё. */
  variant: StorefrontProduct['variants'][number] | undefined;
  onOpenCart: () => void;
}) {
  const items = useUnit($items);
  const add = useUnit(variantAdded);

  if (!variant) {
    return (
      <Button block size="cta" disabled>
        <Trans>Выберите размер</Trans>
      </Button>
    );
  }
  if (!isInStock(variant)) {
    return (
      <Button block size="cta" disabled>
        <Trans>Нет в наличии</Trans>
      </Button>
    );
  }
  if (items.some((item) => item.variantId === variant.id)) {
    return (
      <Button block size="cta" variant="confirm" onClick={onOpenCart}>
        <Trans>В корзине · открыть</Trans>
      </Button>
    );
  }
  return (
    <Button block size="cta" variant="primary" onClick={() => add(buildCartItem(product, variant))}>
      <Trans>В корзину · {formatPrice(variant.price)}</Trans>
    </Button>
  );
}
