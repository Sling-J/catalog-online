import type { StorefrontProduct, StorefrontShop } from '@catalog/contract';
import { StockPill } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useState } from 'react';

import { findVariant, getPriceRange, type Selection } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import { formatPrice } from '@/shared/lib';
import { Icon } from '@/shared/ui';

import { ProductGallery } from './product-gallery';
import { ShareButton } from './share-button';
import { VariantPicker } from './variant-picker';

const roundButton =
  'flex size-11 items-center justify-center rounded-full bg-white/90 text-ink-night shadow-[0_4px_14px_rgb(23_19_61/0.12)] backdrop-blur-md';

/**
 * Карточка товара на телефоне: галерея, название, цена, выбор варианта, наличие, описание
 * и закреплённая внизу кнопка. «Назад» возвращает в каталог с прежним выбором (S6).
 */
export function ProductView({
  product,
  shop,
  onBack,
  onOpenCart,
}: {
  product: StorefrontProduct;
  shop: StorefrontShop;
  onBack: () => void;
  onOpenCart: () => void;
}) {
  const { t } = useLingui();
  const [selection, setSelection] = useState<Selection>({});
  const variant = findVariant(product, selection);
  const missingAttribute = product.attributes.find((attribute) => !selection[attribute.id])?.name;
  const range = getPriceRange(product);

  const price = variant
    ? formatPrice(variant.price)
    : range.min === range.max
      ? formatPrice(range.min)
      : t`от ${formatPrice(range.min)}`;

  return (
    <div className="mx-auto min-h-dvh max-w-[640px] bg-paper pb-32 font-sans text-ink-night">
      <div className="relative">
        <ProductGallery photos={product.photos} name={product.name} />
        <button
          type="button"
          onClick={onBack}
          aria-label={t`Назад к каталогу`}
          className={`${roundButton} absolute top-3.5 left-3.5`}
        >
          <Icon name="chevron-left" />
        </button>
        <ShareButton title={product.name} className={`${roundButton} absolute top-3.5 right-3.5`} />
      </div>

      <div className="px-4 pt-[18px]">
        {product.category && <p className="text-caption text-ink-quiet">{product.category.name}</p>}
        <h1 className="mt-1 text-[24px] leading-[1.15] font-extrabold tracking-[-0.02em]">{product.name}</h1>
        <p className="mt-2 text-[26px] font-extrabold tabular-nums">{price}</p>

        <VariantPicker product={product} selection={selection} onChange={setSelection} />

        <div className="mt-3 min-h-[26px] text-[14px] font-semibold">
          {variant ? (
            <StockPill level={variant.stock.level} quantity={variant.stock.quantity} />
          ) : missingAttribute ? (
            <span className="text-ink-quiet">
              <Trans>Выберите {missingAttribute.toLowerCase()}, чтобы увидеть наличие</Trans>
            </span>
          ) : null}
        </div>

        {product.description && <p className="mt-4 text-[15px] leading-[1.55] text-ink-soft">{product.description}</p>}

        {shop.address && (
          <p className="mt-[18px] rounded-thumb bg-[#f1effa] px-4 py-3.5 text-[14px] leading-normal text-ink-soft">
            <Trans>
              Можно примерить в магазине: {shop.address}. После заказа магазин подтвердит наличие в WhatsApp.
            </Trans>
          </p>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-paper from-70% to-transparent px-4 pt-3 pb-[22px]">
        <div className="mx-auto max-w-[640px]">
          <AddToCartButton
            product={product}
            variant={variant}
            missingAttribute={missingAttribute}
            onOpenCart={onOpenCart}
          />
        </div>
      </div>
    </div>
  );
}
