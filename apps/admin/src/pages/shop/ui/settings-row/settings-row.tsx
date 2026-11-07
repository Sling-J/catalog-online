import { cx, Icon, type IconName } from '@catalog/ui';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/** Строка настроек раздела «Магазин»: значок в сиреневом квадрате, название, кратко что внутри, стрелка. */
export function SettingsRow({
  to,
  icon,
  title,
  sub,
  first,
}: {
  to: LinkProps['to'];
  icon: IconName;
  title: ReactNode;
  sub: ReactNode;
  first?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cx('flex items-center gap-3 px-3.5 py-3 hover:bg-[#f8f7fd]', !first && 'border-t border-[#f0eef7]')}
    >
      <span className="flex size-10 flex-none items-center justify-center rounded-[13px] bg-lilac-mist">
        <Icon name={icon} size={20} strokeWidth={icon === 'chart' ? 2.4 : 2} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold">{title}</span>
        <span className="block truncate text-[13px] text-ink-quiet">{sub}</span>
      </span>
      <Icon name="chevron-right" size={18} strokeWidth={2.4} className="flex-none text-ink-muted" />
    </Link>
  );
}
