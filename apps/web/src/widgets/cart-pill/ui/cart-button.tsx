import { Trans, useLingui } from '@lingui/react/macro';
import { useUnit } from 'effector-react';

import { $count, $total, cartOpened } from '@/entities/cart';
import { formatPrice } from '@/shared/lib';
import { Icon } from '@/shared/ui';

/**
 * Кнопка корзины с суммой в шапке компьютера: открывает выпадающую панель корзины (S8).
 * На телефоне вместо неё плавающая плашка внизу, поэтому здесь `hidden lg:flex`.
 */
export function CartButton({ subdomain }: { subdomain: string }) {
  const { t } = useLingui();
  const { count, total } = useUnit({ count: $count, total: $total });
  const open = useUnit(cartOpened);

  return (
    <button
      type="button"
      onClick={() => open(subdomain)}
      aria-label={count > 0 ? t`Корзина, товаров: ${count}` : t`Корзина`}
      className="hidden h-12 items-center gap-2 rounded-pill bg-ink-night px-5 text-[15px] font-semibold text-white shadow-press-ink lg:flex"
    >
      <Icon name="cart" size={20} />
      {count > 0 ? <span className="tabular-nums">{formatPrice(total)}</span> : <Trans>Корзина</Trans>}
      {count > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-pill bg-sun px-1 text-[11px] font-bold text-ink-night">
          {count}
        </span>
      )}
    </button>
  );
}
