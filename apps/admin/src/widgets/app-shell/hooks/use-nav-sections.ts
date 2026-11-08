import { useLocation } from '@tanstack/react-router';

import { NAV_ITEMS } from '@/widgets/app-shell/constants';

/** Разделы меню с выделением: один адрес на раздел в любом статусе магазина (UX-аудит, U3). */
export function useNavSections() {
  const pathname = useLocation({ select: (location) => location.pathname });
  return NAV_ITEMS.map((item) => ({
    ...item,
    active:
      item.to === '/'
        ? pathname === '/' || item.match.some((path) => pathname.startsWith(path))
        : item.match.some((path) => pathname.startsWith(path)),
  }));
}
