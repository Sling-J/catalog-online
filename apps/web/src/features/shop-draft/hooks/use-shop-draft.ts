import type { StorefrontShop } from '@catalog/contract';
import { zAdminToStorefrontMessage, type StorefrontToAdminMessage } from '@catalog/contract/preview';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';

import { shopQueryOptions } from '@/entities/shop';
import { isPreviewMode } from '@/shared/api';
import { serviceUrls } from '@/shared/lib';

/**
 * Превью в админке (A7): витрина в iframe принимает несохранённые правки магазина через postMessage и
 * показывает их поверх сохранённых; «reload» — правки сохранены, перечитываем всё. Только в режиме превью
 * и только от админки (проверяем отправителя и адрес). Пока превью открыто, магазин сам не перечитывается,
 * чтобы ответ сервера не стёр правки.
 */
export function useShopDraft(subdomain: string): void {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isPreviewMode() || window.parent === window) return;
    // админка — `https://app.<домен>` или VITE_ADMIN_ORIGIN
    const origin = serviceUrls(window.location.origin).admin;
    const { queryKey } = shopQueryOptions(subdomain);
    queryClient.setQueryDefaults(queryKey, { staleTime: Infinity, refetchOnWindowFocus: false });
    // сохранённый магазин: правки каждый раз накладываем на него, так отменённая правка возвращает прежнее
    let saved: StorefrontShop | undefined;

    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== window.parent) return;
      const parsed = zAdminToStorefrontMessage.safeParse(event.data);
      if (!parsed.success) return;
      const message = parsed.data;
      if (message.type === 'reload') {
        saved = undefined;
        void queryClient.invalidateQueries();
        return;
      }
      saved ??= queryClient.getQueryData(queryKey);
      if (saved) queryClient.setQueryData(queryKey, { ...saved, ...message.shop });
    };

    window.addEventListener('message', onMessage);
    window.parent.postMessage(
      { source: 'catalog-storefront', type: 'ready' } satisfies StorefrontToAdminMessage,
      origin,
    );
    return () => window.removeEventListener('message', onMessage);
  }, [queryClient, subdomain]);
}
