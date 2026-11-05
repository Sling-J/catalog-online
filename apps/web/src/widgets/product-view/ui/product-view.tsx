import type { StorefrontProduct, StorefrontProductCard, StorefrontShop } from '@catalog/contract';
import { cx, Icon, useIsDesktop, formatPrice } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { findVariant, getPriceRange, isInStock, ProductTile, type Selection } from '@/entities/product';
import { AddToCartButton } from '@/features/add-to-cart';
import { AskInWhatsApp } from '@/features/ask-in-whatsapp';
import { isClientNavigation } from '@/shared/lib';

import { ProductGallery } from './product-gallery';
import { ShareButton } from './share-button';
import { VariantPicker } from './variant-picker';

const roundButton =
  'flex size-11 items-center justify-center rounded-full bg-white/88 text-ink-night shadow-[0_4px_14px_rgb(23_19_61/0.12)] backdrop-blur-[10px]';

const arrowButton =
  'fixed top-1/2 z-40 hidden size-[52px] -translate-y-1/2 items-center justify-center rounded-full bg-white/92 text-ink-night hover:bg-white hover:shadow-hover lg:flex';

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
  related = [],
}: {
  product: StorefrontProduct;
  shop: StorefrontShop;
  /** Другие товары категории — показываются под закончившимся товаром («Ещё в этой категории»). */
  related?: StorefrontProductCard[];
  onBack: () => void;
  onOpenCart: () => void;
  /** Соседние товары каталога; `undefined`, если соседа нет или каталог не загружен. */
  onPrev?: () => void;
  onNext?: () => void;
}) {
  const { t } = useLingui();
  const desktop = useIsDesktop();
  // экран въезжает (окно всплывает), только если его открыли из каталога, а не загрузили по ссылке
  const [animate] = useState(isClientNavigation);
  const [selection, setSelection] = useState<Selection>({});
  const variant = findVariant(product, selection);
  const range = getPriceRange(product);
  // все варианты закончились — купить нельзя, можно спросить о поступлении (старая ссылка на товар)
  const soldOut = !product.variants.some(isInStock);

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

  // наличие выбранного варианта — строкой текста под размерами (макет V6)
  const stock = !variant
    ? { text: t`Выберите размер, чтобы увидеть наличие`, tone: 'text-ink-quiet' }
    : variant.stock.level === 'out'
      ? { text: t`Нет в наличии`, tone: 'text-stock-out' }
      : variant.stock.level === 'low'
        ? {
            text:
              typeof variant.stock.quantity === 'number' ? t`Осталось ${variant.stock.quantity} шт.` : t`Осталось мало`,
            tone: 'text-stock-low',
          }
        : { text: t`В наличии`, tone: 'text-stock-in' };

  return (
    <div
      onClick={(event) => {
        if (desktop && event.target === event.currentTarget) onBack();
      }}
      // слой поверх страницы: телефон — экран, который въезжает справа целиком (вместе с нижней кнопкой);
      // компьютер — затемнение с окном по центру. Анимация — только при переходе из каталога, не при загрузке
      className={cx(
        'fixed inset-0 z-30 bg-paper font-sans text-ink-night lg:flex lg:items-center lg:justify-center lg:bg-ink-night/55 lg:p-8',
        animate && 'motion-safe:max-lg:animate-slide-in motion-safe:lg:animate-fade-fast',
      )}
    >
      <div
        role={desktop ? 'dialog' : undefined}
        aria-modal={desktop || undefined}
        aria-label={desktop ? product.name : undefined}
        className={cx(
          'mx-auto h-full max-w-[640px] overflow-y-auto overscroll-contain pb-32 lg:relative lg:flex lg:h-[min(720px,calc(100dvh-64px))] lg:w-[min(1040px,100%)] lg:max-w-none lg:overflow-hidden lg:rounded-panel lg:bg-white lg:pb-0 lg:shadow-[0_40px_100px_rgb(11_10_38/0.35)]',
          animate && 'motion-safe:lg:animate-pop',
        )}
      >
        <div className="relative lg:w-[576px] lg:flex-none">
          {/* закончившийся товар: серое фото с плашкой «Закончился» */}
          <div className={cx('lg:h-full', soldOut && 'grayscale-[.85] brightness-105')}>
            {/* key: при переходе стрелками к соседнему товару галерея начинается с первого фото */}
            <ProductGallery key={product.id} photos={product.photos} name={product.name} short={soldOut} />
          </div>
          {soldOut && (
            <span className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -rotate-[4deg] rounded-pill bg-ink-night px-[18px] py-2.5 text-[16px] font-extrabold text-white lg:px-[22px] lg:py-3 lg:text-[20px]">
              <Trans>Закончился</Trans>
            </span>
          )}
          <button
            type="button"
            onClick={onBack}
            aria-label={t`Назад к каталогу`}
            className={`${roundButton} absolute top-3.5 left-3.5 lg:hidden`}
          >
            <Icon name="chevron-left" strokeWidth={2.4} />
          </button>
          {/* на компьютере и у закончившегося товара «Поделиться» в макете нет */}
          {!soldOut && (
            <ShareButton title={product.name} className={`${roundButton} absolute top-3.5 right-3.5 lg:hidden`} />
          )}
        </div>

        <div className="lg:flex lg:min-w-0 lg:flex-1 lg:flex-col lg:overflow-y-auto">
          <div className="px-4 pt-[18px] lg:flex-1 lg:px-8 lg:pt-[30px]">
            {product.category && <p className="text-[13px] text-ink-quiet lg:text-[14px]">{product.category.name}</p>}
            {soldOut ? (
              // телефон: название и серая цена в одну строку; компьютер: столбиком, как у обычного товара
              <div className="mt-1 flex items-baseline justify-between gap-3 lg:mt-1.5 lg:mr-14 lg:block">
                <h1 className="text-[22px] leading-[1.15] font-extrabold tracking-[-0.02em] lg:text-[30px] lg:leading-[1.1] lg:tracking-[-0.03em]">
                  {product.name}
                </h1>
                <p className="flex-none text-[20px] font-extrabold text-stock-out tabular-nums lg:mt-2.5 lg:text-[28px]">
                  {price}
                </p>
              </div>
            ) : (
              <>
                <h1 className="mt-1 text-[24px] leading-[1.15] font-extrabold tracking-[-0.02em] lg:mt-1.5 lg:mr-14 lg:text-[30px] lg:leading-[1.1] lg:tracking-[-0.03em]">
                  {product.name}
                </h1>
                <p className="mt-2 text-[26px] font-extrabold tabular-nums lg:mt-2.5 lg:text-[28px]">{price}</p>
              </>
            )}

            {soldOut ? (
              <>
                <p className="mt-2.5 text-[15px] leading-normal text-ink-soft lg:mt-4 lg:leading-[1.55]">
                  <Trans>Этот товар раскупили. Магазин может привезти ещё — спросите о поступлении</Trans>
                  <span className="hidden lg:inline">
                    <Trans>, название товара уже будет в сообщении</Trans>
                  </span>
                  .
                </p>
                <div className="mt-3.5 lg:mt-[18px]">
                  <AskInWhatsApp
                    block
                    phone={shop.whatsapp}
                    message={t`Здравствуйте! Подскажите, будет ли поступление: ${product.name}?`}
                  >
                    <Trans>Спросить о поступлении</Trans>
                  </AskInWhatsApp>
                </div>
                {related.length > 0 && (
                  <section className="mt-6 lg:mt-[30px]">
                    <h2 className="text-[15px] font-bold">
                      <Trans>Ещё в этой категории</Trans>
                    </h2>
                    {/* телефон: до шести плиток во всю ширину; компьютер: три в ряд внутри окна */}
                    <ul className="-mx-4 mt-2.5 grid grid-cols-3 gap-0.5 lg:mx-0 lg:mt-3 lg:gap-2">
                      {related.slice(0, desktop ? 3 : 6).map((card) => (
                        <li key={card.id}>
                          <ProductTile card={card} />
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </>
            ) : (
              <>
                <VariantPicker product={product} selection={selection} onChange={setSelection} />

                <p className={cx('mt-3 text-[14px] font-semibold', stock.tone)}>{stock.text}</p>

                {product.description && (
                  <p className="mt-4 text-[15px] leading-[1.55] text-ink-soft">{product.description}</p>
                )}

                {shop.address && (
                  <p className="mt-[18px] rounded-thumb bg-[#f1effa] px-4 py-3.5 text-[14px] leading-normal text-ink-soft lg:mt-4">
                    <Trans>Можно примерить в магазине: {shop.address}.</Trans>
                    <span className="lg:hidden">
                      {' '}
                      <Trans>После заказа магазин подтвердит наличие в WhatsApp.</Trans>
                    </span>
                  </p>
                )}
              </>
            )}
          </div>

          {!soldOut && (
            <div
              className={`fixed inset-x-0 bottom-0 z-10 bg-linear-to-t from-paper from-70% to-transparent px-4 pt-3 pb-[22px] lg:sticky lg:inset-x-auto lg:bottom-0 lg:bg-none lg:bg-white lg:px-8 lg:pt-[18px] lg:pb-7`}
            >
              <div className="mx-auto max-w-[640px] lg:max-w-none">
                <AddToCartButton product={product} variant={variant} onOpenCart={onOpenCart} />
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={onBack}
          aria-label={t`Закрыть`}
          className="absolute top-5 right-5 hidden size-11 items-center justify-center rounded-full bg-[#f1effa] text-ink-night hover:bg-lilac-hover lg:flex"
        >
          <Icon name="close" size={18} strokeWidth={2.4} />
        </button>
      </div>

      {onPrev && (
        <button
          type="button"
          onClick={onPrev}
          aria-label={t`Предыдущий товар`}
          className={`${arrowButton} left-[max(16px,calc(50%-644px))]`}
        >
          <Icon name="chevron-left" size={22} strokeWidth={2.4} />
        </button>
      )}
      {onNext && (
        <button
          type="button"
          onClick={onNext}
          aria-label={t`Следующий товар`}
          className={`${arrowButton} right-[max(16px,calc(50%-644px))]`}
        >
          <Icon name="chevron-right" size={22} strokeWidth={2.4} />
        </button>
      )}
    </div>
  );
}
