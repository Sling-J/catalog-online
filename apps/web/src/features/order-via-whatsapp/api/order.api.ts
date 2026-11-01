import { trackEvent } from '@/shared/api';

/**
 * Сообщает витрине, что покупатель нажал «Заказать через WhatsApp» — для статистики магазина (FR-A10).
 * Заказ не передаётся и не хранится (D14); сбой статистики заказу не мешает.
 */
export async function trackOrderClick(subdomain: string): Promise<void> {
  await trackEvent(subdomain, { type: 'order_click' });
}
