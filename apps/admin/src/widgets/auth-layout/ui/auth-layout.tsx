import { cx } from '@catalog/ui';
import type { ReactNode } from 'react';

import { Brand } from '@/shared/ui';

import { Pitch } from './pitch';
import { StateBadge, type StateBadgeKind } from './state-badge';

/**
 * Экраны без меню: регистрация, вход, пароль (макеты AdminPhone2 / AdminDesk2, экран 1; AdminAuth*).
 * Телефон — одна колонка на бумаге. Компьютер — форма слева на белом (640 px), справа сиреневая колонка
 * с обещанием сервиса и тремя шагами. Со значком (`badge`) — экран-состояние: «Проверьте почту», «Ссылка устарела».
 */
export function AuthLayout({
  title,
  subtitle,
  badge,
  children,
}: {
  title: ReactNode;
  subtitle: ReactNode;
  badge?: StateBadgeKind;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh">
      <main className="w-full px-6 pt-10 pb-10 lg:w-[640px] lg:flex-none lg:bg-white lg:px-16 lg:py-12">
        <Brand />
        {badge && <StateBadge kind={badge} className="mt-[72px] lg:mt-[90px]" />}
        <h1
          className={cx(
            'text-[32px] leading-[1.1] font-extrabold tracking-[-0.03em] lg:text-[42px] lg:leading-[1.08] lg:tracking-[-0.035em]',
            badge ? 'mt-6 lg:mt-[26px]' : 'mt-10 lg:mt-[90px]',
          )}
        >
          {title}
        </h1>
        <p className="mt-2.5 text-[16px] leading-[1.5] text-ink-soft lg:mt-3 lg:text-[17px] lg:leading-[1.55]">
          {subtitle}
        </p>
        {children}
      </main>
      <Pitch />
    </div>
  );
}
