import { useLingui } from '@lingui/react/macro';

import type { NavKey } from '@/widgets/app-shell/constants';

/** Подписи разделов меню. */
export function useNavLabels(): Record<NavKey, string> {
  const { t } = useLingui();
  return { home: t`Главная`, products: t`Товары`, shop: t`Магазин` };
}
