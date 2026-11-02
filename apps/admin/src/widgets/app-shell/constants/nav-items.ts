import type { IconName } from '@catalog/ui';

/** Разделы админки (admin.md, «Навигация»): одинаковы в нижнем меню телефона и в колонке компьютера. */
export const NAV_ITEMS = [
  { key: 'products', to: '/products', icon: 'tag' },
  { key: 'import', to: '/import', icon: 'upload' },
  { key: 'shop', to: '/shop', icon: 'store' },
] as const satisfies readonly { key: string; to: string; icon: IconName }[];

export type NavKey = (typeof NAV_ITEMS)[number]['key'];
