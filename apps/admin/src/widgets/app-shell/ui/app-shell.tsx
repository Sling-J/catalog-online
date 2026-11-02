import type { ReactNode } from 'react';

import { useShellData } from '@/widgets/app-shell/hooks';

import { BottomNav } from './bottom-nav';
import { SideNav } from './side-nav';
import { TopBar } from './top-bar';

/**
 * Оболочка рабочих разделов (A1): сиреневое меню снизу на телефоне и колонкой слева на компьютере,
 * рабочая область на бумаге. Магазин, статус витрины и «Витрина» — в шапке телефона и в колонке компьютера.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { shop, productCount, url } = useShellData();
  const name = shop.name ?? '';
  return (
    <div className="min-h-dvh lg:pl-[248px]">
      <SideNav name={name} logo={shop.logo} status={shop.status} url={url} productCount={productCount} />
      <TopBar name={name} logo={shop.logo} status={shop.status} url={url} />
      <main className="px-4 pt-[18px] pb-[calc(108px+env(safe-area-inset-bottom))] lg:px-8 lg:py-7">{children}</main>
      <BottomNav />
    </div>
  );
}
