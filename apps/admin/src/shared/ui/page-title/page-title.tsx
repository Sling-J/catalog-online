import type { ReactNode } from 'react';

/** Заголовок раздела: 28 px на телефоне, 30 px на компьютере (макеты админки); справа — действия раздела. */
export function PageTitle({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <h1 className="text-[28px] font-extrabold tracking-[-0.03em] lg:text-[30px]">{children}</h1>
      {actions && <div className="flex items-center gap-2.5">{actions}</div>}
    </div>
  );
}
