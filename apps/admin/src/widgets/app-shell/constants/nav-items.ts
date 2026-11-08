import type { IconName } from '@catalog/ui';

/**
 * Разделы админки (A31, UX-аудит): одинаковы в нижнем меню телефона и в колонке компьютера и не зависят от статуса
 * магазина. `match` — какие адреса относятся к разделу: импорт — действие с товарами, статистика — экран главной.
 */
export const NAV_ITEMS = [
  { key: 'home', to: '/', icon: 'home', match: ['/stats'] },
  { key: 'products', to: '/products', icon: 'tag', match: ['/products', '/import'] },
  // на компьютере «Магазин» открывает первый пункт подменю настроек, на телефоне — список настроек
  { key: 'shop', to: '/shop', deskTo: '/shop/info', icon: 'store', match: ['/shop'] },
] as const satisfies readonly {
  key: string;
  to: string;
  deskTo?: string;
  icon: IconName;
  match: readonly string[];
}[];

export type NavKey = (typeof NAV_ITEMS)[number]['key'];
