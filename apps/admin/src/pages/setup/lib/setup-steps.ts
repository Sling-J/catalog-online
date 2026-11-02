import type { Shop } from '@catalog/contract';

/** Первый незаполненный шаг мастера: дальше него пройти нельзя (логотип необязателен — шаг 4). */
export function firstIncompleteStep(shop: Pick<Shop, 'name' | 'subdomain' | 'whatsapp'>): number {
  if (!shop.name) return 1;
  if (!shop.subdomain) return 2;
  if (!shop.whatsapp) return 3;
  return 4;
}
