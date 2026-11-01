import type { StorefrontProductCard } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { productPath } from '@/entities/product/lib';
import { formatPrice } from '@/shared/lib';

/**
 * Квадрат товара в сетке: фото, цена пилюлей, плашка «мало».
 * Названия на телефоне нет (оно в карточке товара), на компьютере оно появляется при наведении (S7).
 */
export function ProductTile({ card }: { card: StorefrontProductCard }) {
  const out = card.stockLevel === 'out';
  return (
    <Link
      to="/$product"
      params={{ product: productPath(card) }}
      aria-label={card.name}
      className="group relative block overflow-hidden bg-chip-haze"
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
            'block aspect-square w-full object-cover transition-transform duration-[400ms] ease-out-soft group-hover:scale-105',
            out && 'opacity-50 grayscale',
          )}
        />
      ) : (
        <span aria-hidden="true" className="block aspect-square w-full" />
      )}
      <span className="absolute bottom-1.5 left-1.5 rounded-pill bg-white/90 px-2 py-1 text-[12px] font-bold tabular-nums backdrop-blur-sm">
        {card.priceVaries ? <Trans>от {formatPrice(card.price)}</Trans> : formatPrice(card.price)}
      </span>
      {card.stockLevel === 'low' && (
        <span className="absolute top-1.5 right-1.5 rounded-pill bg-[#fff1d6] px-[7px] py-[3px] text-[10px] font-bold text-[#7a4300]">
          <Trans>мало</Trans>
        </span>
      )}
      {out && (
        <span className="absolute top-1.5 right-1.5 rounded-pill bg-chip-haze px-[7px] py-[3px] text-[10px] font-bold text-stock-out">
          <Trans>нет в наличии</Trans>
        </span>
      )}
      <span className="absolute inset-x-0 top-0 hidden bg-linear-to-b from-ink-night/70 to-transparent px-2.5 pt-2 pb-5 text-[13px] font-semibold text-white opacity-0 transition-opacity group-hover:opacity-100 lg:block">
        {card.name}
      </span>
    </Link>
  );
}
