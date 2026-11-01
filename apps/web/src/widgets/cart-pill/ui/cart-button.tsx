import { cx } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useUnit } from 'effector-react';

import { $count, $open, $total, cartOpened } from '@/entities/cart';
import { formatPrice } from '@/shared/lib';
import { Icon } from '@/shared/ui';

/**
 * Кнопка корзины в шапке компьютера: «Корзина» или «3 · 31 700 ₸», открывает выпадающую панель корзины (S8);
 * пока панель открыта, вокруг кнопки кольцо. На телефоне вместо неё плавающая плашка внизу, поэтому `hidden lg:flex`.
 */
export function CartButton({ subdomain }: { subdomain: string }) {
  const { t } = useLingui();
  const { count, total, open } = useUnit({ count: $count, total: $total, open: $open });
  const openCart = useUnit(cartOpened);

  return (
    <button
      type="button"
      onClick={() => openCart(subdomain)}
      aria-expanded={open}
      aria-label={count > 0 ? t`Корзина, товаров: ${count}` : t`Корзина`}
      className={cx(
        'hidden h-12 items-center gap-2.5 rounded-pill bg-ink-night pr-[18px] hover:bg-ink-hover pl-3.5 text-[15px] font-bold text-white tabular-nums lg:flex',
        open && 'shadow-[0_0_0_3px_#fff,0_0_0_5px_var(--color-iris)]',
      )}
    >
      <Icon name="bag" size={20} />
      {count > 0 ? `${count} · ${formatPrice(total)}` : <Trans>Корзина</Trans>}
    </button>
  );
}
