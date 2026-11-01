import { useSyncExternalStore } from 'react';

const DESKTOP = '(min-width: 1024px)';

const subscribe = (onChange: () => void) => {
  const query = window.matchMedia(DESKTOP);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
};

/**
 * Ширина компьютера (от 1024px). На сервере всегда `false`: разметку сервера строим для телефона,
 * а всё, что зависит от ширины, дорисовывается после гидратации.
 */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(DESKTOP).matches,
    () => false,
  );
}
