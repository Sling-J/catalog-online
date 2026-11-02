import type { ShopStatus } from '@catalog/contract';
import { useLocation } from '@tanstack/react-router';

import { NAV_ITEMS } from '@/widgets/app-shell/constants';

/**
 * Разделы меню с адресом и выделением. Пока магазин в черновике, «Магазин» ведёт на главную с чек-листом
 * (A17): до запуска чек-лист и есть этот раздел, поэтому «Магазин» выделен и на `/`. После публикации — экран раздела.
 */
export function useNavSections(status: ShopStatus) {
  const pathname = useLocation({ select: (location) => location.pathname });
  return NAV_ITEMS.map((item) => ({
    ...item,
    to: item.key === 'shop' && status === 'draft' ? ('/' as const) : item.to,
    active: item.key === 'shop' ? pathname === '/' || pathname.startsWith(item.to) : pathname.startsWith(item.to),
  }));
}
