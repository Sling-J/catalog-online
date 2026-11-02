import type { StockLevel } from '@catalog/ui';

/** Уровень остатка товара для списка: нет, «мало» (не больше порога магазина) или есть. */
export function stockLevel(totalStock: number, lowStockThreshold: number): StockLevel {
  if (totalStock === 0) return 'out';
  return totalStock <= lowStockThreshold ? 'low' : 'in';
}
