import { useLingui } from '@lingui/react/macro';

import type { NavKey } from '@/widgets/app-shell/constants';

/** Подписи разделов меню. */
export function useNavLabels(): Record<NavKey, string> {
  const { t } = useLingui();
  return { products: t`Товары`, import: t`Импорт`, shop: t`Магазин` };
}
