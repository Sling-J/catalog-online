import type { Shop } from '@catalog/contract';

export type ReadinessInput = {
  name: string | null;
  subdomain: string | null;
  whatsapp: string | null;
  address: string | null;
  schedule: Record<string, unknown>;
};

export type ProductCounts = { total: number; visible: number; withoutPhoto: number };

/**
 * Чек-лист на главной до публикации (FR-A2, A33). `settingsFilled` — необязательный пункт «Расскажите о магазине»:
 * есть адрес и хотя бы один рабочий день. `canPublish` — как в контракте: название, адрес витрины, WhatsApp и хотя бы
 * один видимый товар; подтверждённую почту публикация проверяет отдельно (A9).
 */
export function computeReadiness(shop: ReadinessInput, counts: ProductCounts): Shop['readiness'] {
  return {
    settingsFilled: Boolean(shop.address) && Object.values(shop.schedule).some((day) => day !== null),
    productCount: counts.total,
    productsWithoutPhoto: counts.withoutPhoto,
    canPublish: Boolean(shop.name && shop.subdomain && shop.whatsapp) && counts.visible > 0,
  };
}
