import type { StorefrontShop } from '@catalog/contract';
import { Trans, useLingui } from '@lingui/react/macro';
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
    // телефон: шапка закреплена, на бумаге под стеклом; компьютер: белая строка 84 px, категории ниже на бумаге
    <header className="sticky top-0 z-10 border-b border-[#eceaf5] bg-paper/94 backdrop-blur-[14px] lg:static lg:border-b-0 lg:bg-transparent lg:backdrop-blur-none">
      <div className="lg:border-b lg:border-[#eceaf5] lg:bg-white">
        <div className="mx-auto flex max-w-[1240px] flex-wrap items-center gap-x-2.5 gap-y-3 px-4 pt-3.5 pb-3 lg:h-[84px] lg:flex-nowrap lg:gap-6 lg:px-5 lg:py-0">
          <button
            type="button"
            onClick={onOpenAbout}
            aria-label={t`О магазине: адрес, график, контакты`}
            className="order-1 flex min-w-0 flex-1 items-center gap-3 rounded-field text-left lg:max-w-[360px] lg:flex-none"
          >
            <ShopAvatar name={shop.name} logo={shop.logo} className="lg:size-12 lg:text-[16px]" />
            <span className="min-w-0">
              <span className="flex items-center gap-1 text-[17px] font-extrabold lg:text-[18px]">
                <span className="truncate">{shop.name}</span>
                {/* телефон: шторка, компьютер: выпадающая панель */}
                <Icon name="chevron-right" size={16} strokeWidth={2.4} className="flex-none text-ink-muted lg:hidden" />
                <Icon
                  name="chevron-down"
                  size={16}
                  strokeWidth={2.4}
                  className="hidden flex-none text-ink-muted lg:block"
                />
              </span>
              {/* при нехватке места сокращаем адрес, а не статус «Открыто до…» */}
              <span className="flex text-[13px] text-ink-quiet">
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
            className={`order-2 flex size-11 flex-none items-center justify-center rounded-full bg-mint text-mint-ink shadow-[0_3px_0_var(--color-mint-underside)] lg:order-3 lg:h-12 lg:w-auto lg:px-[18px] ${search ? '' : 'lg:ml-auto'}`}
          >
            <Icon name="whatsapp" size={22} className="lg:hidden" />
            <span className="hidden text-[15px] font-bold lg:inline">
              <Trans>Написать в WhatsApp</Trans>
            </span>
          </a>
          {actions && <div className="order-4 hidden lg:block">{actions}</div>}
        </div>
      </div>
      {children && <div className="mx-auto max-w-[1240px]">{children}</div>}
    </header>
  );
}
