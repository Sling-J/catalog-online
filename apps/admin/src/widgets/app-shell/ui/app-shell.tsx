import { cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useMatches } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { meQueryOptions } from '@/entities/session';
import { useShellData } from '@/widgets/app-shell/hooks';

import { BottomNav } from './bottom-nav';
import { SideNav } from './side-nav';
import { TopBar } from './top-bar';

/**
 * Оболочка рабочих разделов (A1): сиреневое меню снизу на телефоне и колонкой слева на компьютере,
 * рабочая область на бумаге. Разделы — «Главная», «Товары», «Магазин» (A31). Магазин, статус витрины и «Витрина» —
 * в шапке телефона и в колонке компьютера.
 * Вход сотрудника «от имени» — тёмная плашка сверху.
 * Вложенный экран (`staticData.subScreen`) на телефоне — без шапки и меню: «Назад» и кнопку рисует сам экран.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { shop, productCount, url } = useShellData();
  const name = shop.name ?? '';
  const subScreen = useMatches({ select: (matches) => matches.some((match) => match.staticData.subScreen) });
  // `me` уже в кеше: его загрузил маршрут оболочки
  const { data: me } = useSuspenseQuery(meQueryOptions());
  return (
    <div className="min-h-dvh lg:pl-[248px]">
      <SideNav name={name} logo={shop.logo} status={shop.status} url={url} productCount={productCount} />
      {/* вход сотрудника «от имени» (FR-S3, ADR 0005): видно, в чьей админке работаешь */}
      {me.account.impersonated && (
        <p role="status" className="bg-ink-night px-4 py-2 text-center text-[13px] font-semibold text-white">
          <Trans>Вы вошли от имени магазина · {me.account.email}</Trans>
        </p>
      )}
      {!subScreen && <TopBar name={name} logo={shop.logo} status={shop.status} />}
      <main
        className={cx(
          'lg:px-8',
          subScreen
            ? 'pb-[calc(100px+env(safe-area-inset-bottom))] lg:py-6'
            : 'px-4 pt-[18px] pb-[calc(108px+env(safe-area-inset-bottom))] lg:py-7',
        )}
      >
        {children}
      </main>
      {!subScreen && <BottomNav />}
    </div>
  );
}
