import type { StorefrontShop } from '@catalog/contract';
import { useLingui } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { OpenStatus, ShopAvatar, whatsappLink } from '@/entities/shop';
import { Icon } from '@/shared/ui';

/** Шапка магазина, закреплена при прокрутке. Нажатие на название открывает «О магазине». */
export function ShopHeader({
  shop,
  onOpenAbout,
  children,
}: {
  shop: StorefrontShop;
  onOpenAbout: () => void;
  /** Что закреплено под строкой магазина: категории (позже поиск и фильтры). */
  children?: ReactNode;
}) {
  const { t } = useLingui();

  return (
    <header className="sticky top-0 z-10 border-b border-[#eceaf5] bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] items-center gap-2.5 px-4 pt-3.5 pb-3">
        <button
          type="button"
          onClick={onOpenAbout}
          aria-label={t`О магазине: адрес, график, контакты`}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-field text-left"
        >
          <ShopAvatar name={shop.name} logo={shop.logo} />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-[17px] font-extrabold">
              <span className="truncate">{shop.name}</span>
              <Icon name="chevron-right" size={16} className="flex-none text-ink-muted" />
            </span>
            <span className="block truncate text-caption text-ink-quiet">
              {shop.address && <>{shop.address} · </>}
              <OpenStatus schedule={shop.schedule} timezone={shop.timezone} />
            </span>
          </span>
        </button>
        <a
          href={whatsappLink(shop.whatsapp)}
          target="_blank"
          rel="noreferrer"
          aria-label={t`Написать в WhatsApp`}
          className="flex size-11 flex-none items-center justify-center rounded-full bg-mint text-mint-ink shadow-press-mint"
        >
          <Icon name="whatsapp" size={22} />
        </a>
      </div>
      {children && <div className="mx-auto max-w-[1240px]">{children}</div>}
    </header>
  );
}
