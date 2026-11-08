import type { Image, ShopStatus as Status } from '@catalog/contract';
import { cx } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { ShopAvatar, ShopStatus } from '@/entities/shop';

/**
 * Магазин в шапке телефона и колонке компьютера. Логотип и название ведут в аккаунт — почта, пароль, «Выйти»
 * (UX-аудит, U10); статус витрины — к публикации в «Магазине» (L3): самое заметное место о состоянии магазина.
 */
export function ShopCard({
  name,
  logo,
  status,
  desk,
}: {
  name: string;
  logo: Image | null | undefined;
  status: Status;
  /** Узкая карточка колонки компьютера: статус черновика в две строки (A15). */
  desk?: boolean;
}) {
  const { t } = useLingui();
  return (
    <div className={cx('flex min-w-0 items-center gap-2.5', desk ? 'rounded-[20px] bg-glass p-2.5' : 'flex-1')}>
      <Link to="/account" tabIndex={-1} aria-hidden="true" className="flex-none">
        <ShopAvatar name={name} logo={logo} size={desk ? undefined : 'sm'} />
      </Link>
      <div className="min-w-0">
        <Link
          to="/account"
          aria-label={t`${name}: аккаунт и вход`}
          className="block truncate text-[15px] font-bold hover:underline"
        >
          {name}
        </Link>
        <Link to="/shop" aria-label={t`Публикация витрины`} className="block w-fit hover:underline">
          <ShopStatus status={status} stacked={desk} />
        </Link>
      </div>
    </div>
  );
}
