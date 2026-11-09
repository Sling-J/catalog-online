import type { Shop } from '@catalog/contract';

import type { ShopRow } from './shop.repository.js';

/**
 * Строка магазина → `Shop` контракта. Логотип пока всегда `null`: загрузка и сжатие логотипа — в T-406
 * (решение основателя 2026-11-09, T-404), там же — адреса картинок из хранилища.
 */
export function toShop(row: ShopRow, readiness: Shop['readiness']): Shop {
  return {
    id: row.id,
    status: row.status,
    subdomain: row.subdomain,
    name: row.name,
    logo: null,
    description: row.description,
    whatsapp: row.whatsapp,
    instagram: row.instagram,
    address: row.address,
    howToFind: row.howToFind,
    schedule: row.schedule,
    timezone: row.timezone,
    stockDisplay: row.stockDisplay,
    lowStockThreshold: row.lowStockThreshold,
    showOutOfStock: row.showOutOfStock,
    publishedAt: row.publishedAt?.toISOString() ?? null,
    readiness,
  };
}
