import type { Image, ShopStatus as Status } from '@catalog/contract';
import { Icon } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

import { ShopAvatar, ShopStatus } from '@/entities/shop';

/** Шапка телефона: магазин со статусом витрины и кнопка «Витрина» (открывает её в новой вкладке). */
export function TopBar({
  name,
  logo,
  status,
  url,
}: {
  name: string;
  logo: Image | null | undefined;
  status: Status;
  url: string | null;
}) {
  return (
    <header className="flex items-center gap-2.5 px-4 pt-3.5 lg:hidden">
      <ShopAvatar name={name} logo={logo} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-bold">{name}</div>
        <ShopStatus status={status} />
      </div>
      {url && (
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="press inline-flex h-9 flex-none items-center gap-1.5 rounded-pill bg-chip-haze px-3 text-[13px] font-semibold hover:bg-haze-hover"
        >
          <Icon name="external" size={15} />
          <Trans>Витрина</Trans>
        </a>
      )}
    </header>
  );
}
