import type { StockInfo } from '@catalog/contract';

/** Настройка показа наличия магазина (FR-A8, D5). */
export type StockSettings = { stockDisplay: 'levels' | 'exact'; lowStockThreshold: number };

export type StockLevel = StockInfo['level'];

/** Нет — 0; «мало» — не больше порога магазина; иначе «есть». */
export function stockLevel(stock: number, threshold: number): StockLevel {
  if (stock <= 0) return 'out';
  return stock <= threshold ? 'low' : 'in';
}

/** Наличие варианта для покупателя: точное число — только в режиме `exact`. */
export function toStockInfo(stock: number, settings: StockSettings): StockInfo {
  return {
    level: stockLevel(stock, settings.lowStockThreshold),
    quantity: settings.stockDisplay === 'exact' ? Math.max(stock, 0) : null,
  };
}

/** Подпись варианта для корзины — как у витрины (`describeVariant`): «Рост: 110, Цвет: синий»; без свойств — пусто. */
export function variantLabel(values: { attributeName: string; value: string }[]): string {
  return values.map(({ attributeName, value }) => `${attributeName}: ${value}`).join(', ');
}
