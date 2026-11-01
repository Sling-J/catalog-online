import type { SheetPlacement } from '@catalog/ui';

import { useIsDesktop } from './use-is-desktop';

/**
 * Шторка снизу на телефоне; на компьютере — то, что попросили: окно по центру (по умолчанию)
 * или выпадающая панель у левого/правого края. На сервере шторка закрыта, значение не важно.
 */
export function useSheetPlacement(desktop: Exclude<SheetPlacement, 'bottom'> = 'center'): SheetPlacement {
  return useIsDesktop() ? desktop : 'bottom';
}
