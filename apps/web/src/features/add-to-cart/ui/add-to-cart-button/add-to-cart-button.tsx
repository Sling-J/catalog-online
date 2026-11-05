import type { StorefrontProduct } from '@catalog/contract';
import { Button, formatPrice } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useUnit } from 'effector-react';
import type { ReactNode } from 'react';

import { $items, variantAdded } from '@/entities/cart';
import { isInStock } from '@/entities/product';
import { buildCartItem } from '@/features/add-to-cart/lib';

/**
 * Главная кнопка карточки товара. Жёлтая «В корзину · цена» — только при выбранном варианте в наличии;
 * после добавления мятная «В корзине · открыть» (одна жёлтая кнопка на экран). Кнопка между состояниями
 * одна и та же: цвет меняется за 0.2s (`transition` кнопок), подпись проявляется заново (`Label`, 0.15s).
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
        <Label key="pick">
          <Trans>Выберите размер</Trans>
        </Label>
      </Button>
    );
  }
  if (!isInStock(variant)) {
    return (
      <Button block size="cta" disabled>
        <Label key="out">
          <Trans>Нет в наличии</Trans>
        </Label>
      </Button>
    );
  }
  if (items.some((item) => item.variantId === variant.id)) {
    return (
      <Button block size="cta" variant="confirm" onClick={onOpenCart}>
        <Label key="added">
          <Trans>В корзине · открыть</Trans>
        </Label>
      </Button>
    );
  }
  return (
    <Button block size="cta" variant="primary" onClick={() => add(buildCartItem(product, variant))}>
      <Label key="add">
        <Trans>В корзину · {formatPrice(variant.price)}</Trans>
      </Label>
    </Button>
  );
}

/** Подпись кнопки: новый `key` — новый элемент, и он проявляется, а кнопка с её цветом остаётся на месте. */
function Label({ children }: { children: ReactNode }) {
  return <span className="motion-safe:animate-swap">{children}</span>;
}
