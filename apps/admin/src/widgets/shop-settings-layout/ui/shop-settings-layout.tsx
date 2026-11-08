import { cx, Icon, type IconName } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { Link, useLocation } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/**
 * Раздел «Магазин» (A31). Компьютер — как настройки в Shopify и Notion: слева подменю, справа выбранный экран
 * (UX-аудит, D1), без промежуточного списка и пути «Магазин / …». Первым — «О магазине» (в него ведёт «Магазин» в
 * колонке), последним — «Публикация». Телефон — только экран: там «Магазин» — список, а пункты — вложенные
 * экраны со своей «Назад».
 */
export function ShopSettingsLayout({ children }: { children: ReactNode }) {
  const { t } = useLingui();
  const pathname = useLocation({ select: (location) => location.pathname.replace(/\/$/, '') });
  const items: { to: '/shop' | '/shop/info' | '/shop/categories' | '/shop/stock'; icon: IconName; label: string }[] = [
    { to: '/shop/info', icon: 'store', label: t`О магазине` },
    { to: '/shop/categories', icon: 'tag', label: t`Категории и свойства` },
    { to: '/shop/stock', icon: 'eye', label: t`Наличие на витрине` },
    { to: '/shop', icon: 'share', label: t`Публикация` },
  ];
  return (
    <div className="lg:flex lg:items-start lg:gap-8">
      <nav
        aria-label={t`Настройки магазина`}
        className="hidden w-[220px] flex-none flex-col gap-1 lg:sticky lg:top-7 lg:flex"
      >
        <div className="px-3 pb-2 text-[13px] font-semibold text-ink-quiet">{t`Магазин`}</div>
        {items.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex h-11 items-center gap-2.5 rounded-[14px] px-3 text-[14px]',
                active ? 'bg-lilac-mist font-bold' : 'font-semibold text-ink-soft hover:bg-[#f4f2fb]',
              )}
            >
              <Icon name={item.icon} size={18} className="flex-none" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
