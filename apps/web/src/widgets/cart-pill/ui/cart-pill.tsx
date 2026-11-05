import { formatPrice } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { useUnit } from 'effector-react';

import { $count, $total, cartOpened } from '@/entities/cart';

import { useBumpOnAdd } from '@/widgets/cart-pill/lib';

/**
 * Плавающая плашка корзины внизу каталога: «N товара в корзине · сумма → В корзину».
 * Показывается, только когда в корзине что-то есть; на карточке товара её нет — там своя кнопка.
 * Стало больше товаров — коротко «прыгает» (после возврата с карточки — когда поднимется).
 */
export function CartPill({ subdomain }: { subdomain: string }) {
  const { count, total } = useUnit({ count: $count, total: $total });
  const open = useUnit(cartOpened);
  // 0.34s — подъём плашки `animate-sheet-up`
  const bump = useBumpOnAdd<HTMLButtonElement>('pill', count, 340);
  if (count === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-3 bottom-5 z-20 flex justify-center lg:hidden">
      <button
        ref={bump}
        type="button"
        onClick={() => open(subdomain)}
        className="pointer-events-auto flex w-full max-w-[480px] motion-safe:animate-sheet-up items-center gap-2.5 rounded-pill bg-ink-night/90 py-2 pr-2 pl-[18px] text-left text-white backdrop-blur-lg"
      >
        <span className="flex-1">
          <span className="block text-[13px] opacity-80">
            <Plural
              value={count}
              one="# товар в корзине"
              few="# товара в корзине"
              many="# товаров в корзине"
              other="# товара в корзине"
            />
          </span>
          <span className="block text-[15px] font-extrabold tabular-nums">{formatPrice(total)}</span>
        </span>
        <span className="rounded-pill bg-sun px-[18px] py-3 text-[14px] font-bold text-ink-night shadow-press-sun">
          <Trans>В корзину</Trans>
        </span>
      </button>
    </div>
  );
}
