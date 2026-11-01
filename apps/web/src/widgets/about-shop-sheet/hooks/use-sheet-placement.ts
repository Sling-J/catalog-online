import { useSyncExternalStore } from 'react';

const DESKTOP = '(min-width: 1024px)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/** Шторка снизу на телефоне, окно по центру на компьютере. На сервере шторка закрыта, значение не важно. */
export function useSheetPlacement(): 'bottom' | 'center' {
  const desktop = useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
  return desktop ? 'center' : 'bottom';
}
