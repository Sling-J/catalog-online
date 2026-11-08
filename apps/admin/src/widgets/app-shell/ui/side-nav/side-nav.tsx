import type { Image, ShopStatus as Status } from '@catalog/contract';
import { cx, Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { Link } from '@tanstack/react-router';

import { useNavLabels, useNavSections } from '@/widgets/app-shell/hooks';

import { ShopCard } from '../shop-card';
import { StorefrontCard } from '../storefront-card';

/**
 * Колонка компьютера на сиреневом: магазин со статусом (нажатие — аккаунт и публикация), разделы (у «Товаров» —
 * число), внизу «Ваша витрина».
 */
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
  const sections = useNavSections();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 hidden w-[248px] flex-col bg-lilac-field px-4 py-[22px] lg:flex">
      <ShopCard name={name} logo={logo} status={status} desk />
      <nav aria-label={t`Разделы`} className="mt-[22px] flex flex-col gap-1">
        {sections.map((item) => (
          <Link key={item.key} to={'deskTo' in item ? item.deskTo : item.to} className="press">
            <span
              className={cx(
                'flex h-12 items-center gap-3 rounded-2xl px-3.5 text-[15px]',
                item.active
                  ? 'bg-white font-bold shadow-[0_3px_0_rgb(90_70_190/0.25)]'
                  : 'font-semibold hover:bg-glass',
              )}
            >
              <Icon name={item.icon} size={20} strokeWidth={item.active ? 2.2 : 1.8} />
              <span className="flex-1">{labels[item.key]}</span>
              {item.key === 'products' && (
                <span className="inline-flex h-[22px] min-w-[22px] items-center justify-center rounded-pill bg-white/60 px-[7px] text-[12px] font-bold tabular-nums">
                  {productCount}
                </span>
              )}
            </span>
          </Link>
        ))}
      </nav>
      {url && <StorefrontCard url={url} className="mt-auto" />}
    </aside>
  );
}
