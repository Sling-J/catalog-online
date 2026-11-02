import type { Image, ShopStatus as Status } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { ShopAvatar, ShopStatus } from '@/entities/shop';
import { NAV_ITEMS } from '@/widgets/app-shell/constants';
import { useNavLabels } from '@/widgets/app-shell/hooks';

import { StorefrontCard } from '../storefront-card';

/** Колонка компьютера на сиреневом: магазин со статусом, разделы (у «Товаров» — число), внизу «Ваша витрина». */
export function SideNav({
  name,
  logo,
  status,
  url,
  productCount,
}: {
  name: string;
  logo: Image | null | undefined;
  status: Status;
  url: string | null;
  productCount: number;
}) {
  const { t } = useLingui();
  const labels = useNavLabels();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col bg-lilac-field px-4 py-[22px] lg:flex">
      <div className="flex items-center gap-2.5 rounded-[20px] bg-glass p-2.5">
        <ShopAvatar name={name} logo={logo} />
        <div className="min-w-0">
          <div className="truncate text-[15px] font-bold">{name}</div>
          <ShopStatus status={status} stacked />
        </div>
      </div>
      <nav aria-label={t`Разделы`} className="mt-[22px] flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <Link key={item.key} to={item.to} className="press">
            {({ isActive }) => (
              <span
                className={cx(
                  'flex h-12 items-center gap-3 rounded-2xl px-3.5 text-[15px]',
                  isActive ? 'bg-white font-bold shadow-[0_3px_0_rgb(90_70_190/0.25)]' : 'font-semibold hover:bg-glass',
                )}
              >
                <Icon name={item.icon} size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="flex-1">{labels[item.key]}</span>
                {item.key === 'products' && (
                  <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-pill bg-white/60 px-[7px] text-[12px] font-bold tabular-nums">
                    {productCount}
                  </span>
                )}
              </span>
            )}
          </Link>
        ))}
      </nav>
      {url && <StorefrontCard url={url} className="mt-auto" />}
    </aside>
  );
}
