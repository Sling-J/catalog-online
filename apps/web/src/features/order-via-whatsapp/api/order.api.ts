import { trackStorefrontEvent } from '@catalog/contract';

/**
 * Сообщает витрине, что покупатель нажал «Заказать через WhatsApp» — для статистики магазина (FR-A10).
 * Заказ не передаётся и не хранится (D14); сбой статистики заказу не мешает.
 */
export async function trackOrderClick(subdomain: string): Promise<void> {
  try {
    await trackStorefrontEvent({ path: { subdomain }, body: { type: 'order_click' } });
  } catch {
    // статистика не важнее заказа
  }
}
