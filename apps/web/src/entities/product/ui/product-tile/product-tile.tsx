import type { StorefrontProductCard } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { productPath } from '@/entities/product/lib';
import { useIsDesktop } from '@/shared/hooks';
import { formatPrice } from '@/shared/lib';

/**
 * Квадрат товара в сетке: фото, цена пилюлей, плашка «мало».
 * Названия на телефоне нет (оно в карточке товара), на компьютере оно появляется при наведении (S7).
 */
export function ProductTile({ card }: { card: StorefrontProductCard }) {
  const out = card.stockLevel === 'out';
  const desktop = useIsDesktop();
  return (
    <Link
      to="/$product"
      params={{ product: productPath(card) }}
      // выбор в каталоге (категория, фильтры) едет с адресом: под окном товара на компьютере виден тот же каталог
      search
      // на компьютере каталог остаётся под окном на том же месте, на телефоне карточка открывается сверху
      resetScroll={!desktop}
      aria-label={card.name}
      className="press group relative block overflow-hidden bg-chip-haze lg:rounded-[14px]"
    >
      {card.cover ? (
        <img
          src={card.cover.sizes[320]}
          srcSet={`${card.cover.sizes[320]} 320w, ${card.cover.sizes[640]} 640w`}
          sizes="(min-width: 1024px) 240px, 34vw"
          width={card.cover.width}
          height={card.cover.height}
          alt=""
          loading="lazy"
          className={cx(
            'block aspect-square w-full object-cover transition-transform duration-[400ms] ease-out-soft group-hover:scale-[1.04] lg:duration-500',
            out && 'opacity-50 grayscale',
          )}
        />
      ) : (
        <span aria-hidden="true" className="block aspect-square w-full" />
      )}
      <span className="absolute bottom-1.5 left-1.5 rounded-pill bg-white/90 px-2 py-1 text-[12px] font-bold tabular-nums backdrop-blur-[8px] lg:bottom-2 lg:left-2 lg:bg-white/92 lg:px-2.5 lg:py-[5px] lg:text-[14px] lg:backdrop-blur-none">
        {card.priceVaries ? <Trans>от {formatPrice(card.price)}</Trans> : formatPrice(card.price)}
      </span>
      {card.stockLevel === 'low' && (
        // на компьютере «мало» внизу справа, на одной линии с ценой
        <span className="absolute top-1.5 right-1.5 rounded-pill bg-[#fff1d6] px-[7px] py-[3px] text-[10px] font-bold text-[#7a4300] lg:top-auto lg:right-2 lg:bottom-2 lg:px-[9px] lg:py-1 lg:text-[12px]">
          <Trans>мало</Trans>
        </span>
      )}
      {out && (
        <span className="absolute top-1.5 right-1.5 rounded-pill bg-chip-haze px-[7px] py-[3px] text-[10px] font-bold text-stock-out">
          <Trans>нет в наличии</Trans>
        </span>
      )}
      <span className="absolute inset-x-0 top-0 hidden bg-linear-to-b from-ink-night/55 to-transparent px-3 pt-3.5 pb-7 text-left text-[14px] font-semibold text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 lg:block">
        {card.name}
      </span>
    </Link>
  );
}
