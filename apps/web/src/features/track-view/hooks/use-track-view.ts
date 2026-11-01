import { useEffect } from 'react';

import { isPreviewMode, trackEvent } from '@/shared/api';

import { shouldTrackView, viewKey } from '@/features/track-view/lib';

const storage = (): Storage | undefined => {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
};

/**
 * Считает просмотр витрины (без `productId`) или карточки товара для статистики магазина (FR-A10):
 * один раз в сутки на покупателя, только в браузере и не в превью из админки.
 */
export function useTrackView(subdomain: string, productId?: string): void {
  useEffect(() => {
    if (isPreviewMode() || !shouldTrackView(storage(), viewKey(subdomain, productId))) return;
    void trackEvent(subdomain, { type: 'view', productId: productId ?? null });
  }, [subdomain, productId]);
}
