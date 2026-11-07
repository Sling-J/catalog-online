import { useLingui } from '@lingui/react/macro';

import type { FieldTarget } from '../lib';

/** Названия полей в «Куда загрузить» — как в шаблоне (FR-A3). */
export function useTargetLabels(): Record<FieldTarget, string> {
  const { t } = useLingui();
  return {
    sku: t`Артикул`,
    name: t`Название`,
    price: t`Цена`,
    stock: t`Остаток`,
    group_key: t`Код товара`,
    barcode: t`Штрихкод`,
    category: t`Категория`,
    description: t`Описание`,
  };
}
