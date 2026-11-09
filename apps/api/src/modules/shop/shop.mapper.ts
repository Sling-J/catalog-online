import type { Shop } from '@catalog/contract';

import type { ShopRow } from './shop.repository.js';

/** Строка магазина → `Shop` контракта. Логотип — уже с адресами картинок (`Images.toImage`). */
export function toShop(row: ShopRow, readiness: Shop['readiness'], logo: Shop['logo']): Shop {
  return {
    id: row.id,
    status: row.status,
    subdomain: row.subdomain,
    name: row.name,
    logo,
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
