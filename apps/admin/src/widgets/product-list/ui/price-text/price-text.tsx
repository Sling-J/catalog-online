import { formatPrice } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';

/** Цена товара; у вариантов с разной ценой — «от» и наименьшая. */
export function PriceText({ price, varies }: { price: number; varies: boolean }) {
  const value = formatPrice(price);
  return varies ? <Trans>от {value}</Trans> : <>{value}</>;
}
