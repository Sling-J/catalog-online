import type { StorefrontProduct, StorefrontShop } from '@catalog/contract';
import { StockPill } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { findVariant, getPriceRange, type Selection } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import { useIsDesktop } from '@/shared/hooks';
import { formatPrice } from '@/shared/lib';
import { Icon } from '@/shared/ui';

import { ProductGallery } from './product-gallery';
import { ShareButton } from './share-button';
import { VariantPicker } from './variant-picker';

const roundButton =
  'flex size-11 items-center justify-center rounded-full bg-white/90 text-ink-night shadow-[0_4px_14px_rgb(23_19_61/0.12)] backdrop-blur-md';

const arrowButton =
  'fixed top-1/2 z-40 hidden size-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink-night shadow-[0_8px_24px_rgb(23_19_61/0.25)] lg:flex';

/**
 * Карточка товара. Телефон: отдельный экран с кнопкой «Назад», кнопка закреплена внизу (S6).
 * Компьютер: окно поверх каталога — фото слева, информация справа, стрелки по бокам листают соседние
 * товары; закрывается крестиком, Esc и щелчком по затемнению (S8). Разметка одна, окно — классами `lg:`,
 * поэтому первая отрисовка на сервере сразу подходит и телефону, и компьютеру.
 */
export function ProductView({
  product,
  shop,
  onBack,
  onOpenCart,
  onPrev,
  onNext,
}: {
  product: StorefrontProduct;
  shop: StorefrontShop;
  onBack: () => void;
  onOpenCart: () => void;
  /** Соседние товары каталога; `undefined`, если соседа нет или каталог не загружен. */
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const { t } = useLingui();
  const desktop = useIsDesktop();
  const [selection, setSelection] = useState<Selection>({});
  const variant = findVariant(product, selection);
  const missingAttribute = product.attributes.find((attribute) => !selection[attribute.id])?.name;
  const range = getPriceRange(product);

  // окно поверх каталога: страница под ним не прокручивается, закрывается по Esc, листается стрелками
  useEffect(() => {
    if (!desktop) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onBack();
      else if (event.key === 'ArrowLeft') onPrev?.();
      else if (event.key === 'ArrowRight') onNext?.();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [desktop, onBack, onPrev, onNext]);

  const price = variant
    ? formatPrice(variant.price)
    : range.min === range.max
      ? formatPrice(range.min)
      : t`от ${formatPrice(range.min)}`;

  return (
    <div
      onClick={(event) => {
        if (desktop && event.target === event.currentTarget) onBack();
      }}
      className="mx-auto min-h-dvh max-w-[640px] bg-paper pb-32 font-sans text-ink-night lg:fixed lg:inset-0 lg:z-30 lg:flex lg:min-h-0 lg:max-w-none lg:items-center lg:justify-center lg:bg-ink-night/55 lg:p-8 lg:pb-8"
    >
      <div
        role={desktop ? 'dialog' : undefined}
        aria-modal={desktop || undefined}
        aria-label={desktop ? product.name : undefined}
        className="lg:relative lg:flex lg:h-[min(720px,calc(100dvh-64px))] lg:w-[min(1040px,100%)] lg:overflow-hidden lg:rounded-panel lg:bg-white lg:shadow-device"
      >
        <div className="relative lg:w-[55%] lg:flex-none">
          <ProductGallery photos={product.photos} name={product.name} />
          <button
            type="button"
            onClick={onBack}
            aria-label={t`Назад к каталогу`}
            className={`${roundButton} absolute top-3.5 left-3.5 lg:hidden`}
          >
            <Icon name="chevron-left" />
          </button>
          <ShareButton title={product.name} className={`${roundButton} absolute top-3.5 right-3.5`} />
        </div>

        <div className="lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:overflow-y-auto">
          <div className="px-4 pt-[18px] lg:flex-1 lg:px-7 lg:pt-8 lg:pr-[72px]">
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

            {product.description && (
              <p className="mt-4 text-[15px] leading-[1.55] text-ink-soft">{product.description}</p>
            )}

            {shop.address && (
              <p className="mt-[18px] rounded-thumb bg-[#f1effa] px-4 py-3.5 text-[14px] leading-normal text-ink-soft">
                <Trans>
                  Можно примерить в магазине: {shop.address}. После заказа магазин подтвердит наличие в WhatsApp.
                </Trans>
              </p>
            )}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-paper from-70% to-transparent px-4 pt-3 pb-[22px] lg:sticky lg:inset-x-auto lg:bottom-0 lg:bg-none lg:bg-white lg:px-7 lg:pb-7">
            <div className="mx-auto max-w-[640px] lg:max-w-none">
              <AddToCartButton
                product={product}
                variant={variant}
                missingAttribute={missingAttribute}
                onOpenCart={onOpenCart}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onBack}
          aria-label={t`Закрыть`}
          className="absolute top-5 right-5 hidden size-11 items-center justify-center rounded-full bg-[#f1effa] text-ink-night lg:flex"
        >
          <Icon name="close" />
        </button>
      </div>

      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          aria-label={t`Предыдущий товар`}
          className={`${arrowButton} left-[max(16px,calc(50%-596px))]`}
        >
          <Icon name="chevron-left" size={24} />
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          aria-label={t`Следующий товар`}
          className={`${arrowButton} right-[max(16px,calc(50%-596px))]`}
        >
          <Icon name="chevron-right" size={24} />
        </button>
      )}
    </div>
  );
}
