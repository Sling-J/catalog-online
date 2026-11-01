import type { StorefrontProduct } from '@catalog/contract';
import { Button } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useUnit } from 'effector-react';

import { $items, variantAdded } from '@/entities/cart';
import { isInStock } from '@/entities/product';
import { buildCartItem } from '@/features/add-to-cart/lib';
import { formatPrice } from '@/shared/lib';

/**
 * Главная кнопка карточки товара. Жёлтая «В корзину · цена» — только при выбранном варианте в наличии;
 * после добавления мятная «В корзине · открыть» (одна жёлтая кнопка на экран).
 */
export function AddToCartButton({
  product,
  variant,
  missingAttribute,
  onOpenCart,
}: {
  product: StorefrontProduct;
  /** Выбранный вариант; `undefined`, пока выбрано не всё. */
  variant: StorefrontProduct['variants'][number] | undefined;
  /** Название свойства, которое ещё не выбрано, — для подсказки на неактивной кнопке. */
  missingAttribute: string | undefined;
  onOpenCart: () => void;
}) {
  const items = useUnit($items);
  const add = useUnit(variantAdded);

  if (!variant) {
    return (
      <Button block disabled>
        {missingAttribute ? <Trans>Выберите {missingAttribute.toLowerCase()}</Trans> : <Trans>Нет в наличии</Trans>}
      </Button>
    );
  }
  if (!isInStock(variant)) {
    return (
      <Button block disabled>
        <Trans>Нет в наличии</Trans>
      </Button>
    );
  }
  if (items.some((item) => item.variantId === variant.id)) {
    return (
      <Button block variant="confirm" onClick={onOpenCart}>
        <Trans>В корзине · открыть</Trans>
      </Button>
    );
  }
  return (
    <Button block variant="primary" onClick={() => add(buildCartItem(product, variant))}>
      <Trans>В корзину · {formatPrice(variant.price)}</Trans>
    </Button>
  );
}
