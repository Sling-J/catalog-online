import type { ImportRowError } from '@catalog/contract';
import { Trans } from '@lingui/react/macro';

/** Что не так со строкой (макет AdminPhone, экран 5): «цена «12 5OO» — не число», «нет артикула». */
export function RowErrorText({ error }: { error: ImportRowError }) {
  const value = error.value ?? '';
  const column = error.column ?? '';
  switch (error.code) {
    case 'price_invalid':
      return <Trans>цена «{value}» — не число</Trans>;
    case 'stock_invalid':
      return <Trans>остаток «{value}» — не целое число</Trans>;
    case 'sku_missing':
      return <Trans>нет артикула</Trans>;
    case 'sku_duplicate':
      return <Trans>артикул {value} повторяется</Trans>;
    case 'name_missing':
      return <Trans>нет названия</Trans>;
    case 'too_long':
      return <Trans>слишком длинное значение в колонке «{column}»</Trans>;
  }
}
