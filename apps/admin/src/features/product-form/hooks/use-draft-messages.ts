import { useLingui } from '@lingui/react/macro';

import type { DraftError } from '../types';

/** Тексты ошибок черновика: под полем и под таблицей размеров. */
export function useDraftMessages() {
  const { t } = useLingui();
  const messages: Record<DraftError, string> = {
    required: t`Введите название`,
    no_price: t`Укажите цену`,
    no_size: t`Впишите размер в новой строке`,
    duplicate: t`Размеры повторяются — оставьте по одной строке на размер`,
  };
  return (error: DraftError | undefined): string | undefined => (error ? messages[error] : undefined);
}
