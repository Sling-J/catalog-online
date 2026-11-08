import type { Image, ShopStatus as Status } from '@catalog/contract';
import { Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { StorefrontLink } from '@/entities/shop';

import { ShopCard } from '../shop-card';

/**
 * Шапка телефона: магазин со статусом витрины (нажатие — аккаунт и публикация, см. `ShopCard`) и кнопка «Витрина»
 * в новой вкладке; до публикации — превью (UX-аудит, E2).
 */
export function TopBar({ name, logo, status }: { name: string; logo: Image | null | undefined; status: Status }) {
  return (
    <header className="flex items-center gap-2.5 px-4 pt-3.5 lg:hidden">
      <ShopCard name={name} logo={logo} status={status} />
      <StorefrontLink className="press inline-flex h-9 flex-none items-center gap-1.5 rounded-pill bg-chip-haze px-3 text-[13px] font-semibold hover:bg-haze-hover">
        <Icon name="external" size={15} />
        <Trans>Витрина</Trans>
      </StorefrontLink>
    </header>
  );
}
