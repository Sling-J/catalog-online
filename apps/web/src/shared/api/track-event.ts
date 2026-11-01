import { trackStorefrontEvent, type TrackStorefrontEventData } from '@catalog/contract';

import { isPreviewMode } from './preview';

/**
 * Событие для статистики магазина (FR-A10): просмотр или нажатие «Заказать». В превью из админки
 * не отправляем — владелец, глядящий на свою витрину, не покупатель. Сбой статистики покупателю не мешает.
 */
export async function trackEvent(subdomain: string, body: TrackStorefrontEventData['body']): Promise<void> {
  if (isPreviewMode()) return;
  try {
    await trackStorefrontEvent({ path: { subdomain }, body });
  } catch {
    // статистика не важнее покупки
  }
}
