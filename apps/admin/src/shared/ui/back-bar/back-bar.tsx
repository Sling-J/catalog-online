import { Icon } from '@catalog/ui';
import { useLingui } from '@lingui/react/macro';
import { Link, type LinkProps } from '@tanstack/react-router';
import type { ReactNode } from 'react';

/** Шапка вложенного экрана на телефоне: круглая «Назад» и заголовок (макеты админки, backBar). */
export function BackBar({ to, children }: { to: LinkProps['to']; children: ReactNode }) {
  const { t } = useLingui();
  return (
    <div className="flex items-center gap-2.5 px-4 pt-3.5 lg:hidden">
      <Link
        to={to}
        aria-label={t`Назад`}
        className="press flex size-11 flex-none items-center justify-center rounded-full bg-chip-haze hover:bg-haze-hover"
      >
        <Icon name="chevron-left" size={20} strokeWidth={2.4} />
      </Link>
      <h1 className="flex-1 text-[20px] font-extrabold">{children}</h1>
    </div>
  );
}
