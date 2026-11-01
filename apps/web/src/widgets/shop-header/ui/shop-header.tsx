import type { StorefrontShop } from '@catalog/contract';
import { useLingui } from '@lingui/react/macro';
import type { ReactNode } from 'react';

import { OpenStatus, ShopAvatar, whatsappLink } from '@/entities/shop';
import { Icon } from '@/shared/ui';

/**
 * Шапка магазина, закреплена при прокрутке. Нажатие на название открывает «О магазине».
 * Телефон: строка магазина и WhatsApp, под ней поиск, ниже категории. Компьютер: всё в одну строку —
 * магазин, поиск, WhatsApp, корзина; категории под ней (S8).
 */
export function ShopHeader({
  shop,
  onOpenAbout,
  search,
  actions,
  children,
}: {
  shop: StorefrontShop;
  onOpenAbout: () => void;
  /** Поиск и кнопка фильтров. */
  search?: ReactNode;
  /** Кнопки справа в строке компьютера, например корзина; на телефоне не показываются. */
  actions?: ReactNode;
  /** Что закреплено ниже: категории, выбранные фильтры. */
  children?: ReactNode;
}) {
  const { t } = useLingui();

  return (
    <header className="sticky top-0 z-10 border-b border-[#eceaf5] bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-2.5 gap-y-3 px-4 pt-3.5 pb-3 lg:flex-nowrap lg:gap-6 lg:py-4">
        <button
          type="button"
          onClick={onOpenAbout}
          aria-label={t`О магазине: адрес, график, контакты`}
          className="order-1 flex min-w-0 flex-1 items-center gap-3 rounded-field text-left lg:max-w-[360px] lg:flex-none"
        >
          <ShopAvatar name={shop.name} logo={shop.logo} />
          <span className="min-w-0">
            <span className="flex items-center gap-1 text-[17px] font-extrabold">
              <span className="truncate">{shop.name}</span>
              <Icon name="chevron-right" size={16} className="flex-none text-ink-muted" />
            </span>
            {/* при нехватке места сокращаем адрес, а не статус «Открыто до…» */}
            <span className="flex text-caption text-ink-quiet">
              {shop.address && <span className="truncate">{shop.address}</span>}
              {shop.address && <span className="px-1">·</span>}
              <OpenStatus schedule={shop.schedule} timezone={shop.timezone} className="shrink-0 whitespace-nowrap" />
            </span>
          </span>
        </button>
        {search && (
          <div className="order-3 w-full lg:order-2 lg:mx-auto lg:w-auto lg:max-w-[480px] lg:flex-1">{search}</div>
        )}
        <a
          href={whatsappLink(shop.whatsapp)}
          target="_blank"
          rel="noreferrer"
          aria-label={t`Написать в WhatsApp`}
          className="order-2 flex size-11 flex-none items-center justify-center rounded-full bg-mint text-mint-ink shadow-press-mint lg:order-3 lg:size-12"
        >
          <Icon name="whatsapp" size={22} />
        </a>
        {actions && <div className="order-4 hidden lg:block">{actions}</div>}
      </div>
      {children && <div className="mx-auto max-w-[1240px]">{children}</div>}
    </header>
  );
}
