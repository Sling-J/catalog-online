import { useLingui } from '@lingui/react/macro';

import type { ProductSort } from '../api';

/** Подписи порядков списка товаров (FR-A5; UX-аудит, E3): шторка на телефоне, подсказки заголовков таблицы. */
export function useSortLabels(): Record<ProductSort, string> {
  const { t } = useLingui();
  return {
    new: t`Сначала новые`,
    name: t`По названию`,
    price_asc: t`Сначала дешёвые`,
    price_desc: t`Сначала дорогие`,
    stock_asc: t`Меньше остаток`,
  };
}
