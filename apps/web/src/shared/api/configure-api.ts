import { client } from '@catalog/contract';

import { getPreviewToken, PREVIEW_PARAM } from './preview';

let configured = false;

/**
 * Адрес API: VITE_API_URL, иначе адрес из контракта (в разработке его перехватывает MSW).
 * В превью токен из адреса страницы уходит во все запросы витрины — так API отдаёт неопубликованный магазин.
 * Клиент SDK один на процесс, поэтому настраиваем его один раз, а токен берём на каждый запрос.
 */
export function configureApi(): void {
  if (configured) return;
  configured = true;
  const baseUrl = import.meta.env.VITE_API_URL;
  if (baseUrl) client.setConfig({ baseUrl });
  client.interceptors.request.use((request) => {
    const token = getPreviewToken();
    const url = new URL(request.url);
    if (!token || !url.pathname.includes('/v1/storefront/')) return request;
    url.searchParams.set(PREVIEW_PARAM, token);
    return new Request(url, request);
  });
}
