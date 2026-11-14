import { client } from '@catalog/contract';

import { getPreviewToken, PREVIEW_PARAM } from './preview';

const DEV_API_URL = 'http://localhost:3001';

/** Чтение — без заголовков сверх обычных: тогда браузер не шлёт перед каждым запросом к API на другом адресе `OPTIONS`. */
const READ_METHODS = new Set(['GET', 'HEAD']);

let configured = false;

/**
 * Адрес API: VITE_API_URL; в разработке без него — API на http://localhost:3001 (и для SSR, и из браузера: CORS
 * API пускает `*.localhost:3000`). Моки MSW (`--mode mocks`) перехватывают запросы по любому адресу.
 * В превью токен из адреса страницы уходит во все запросы витрины — так API отдаёт неопубликованный магазин.
 * Клиент SDK один на процесс, поэтому настраиваем его один раз, а токен берём на каждый запрос.
 * `X-Requested-With` API требует у изменяющих запросов (корзина, события) — защита от CSRF (api.md, «Вход»). Ставим
 * его только им: у чтения нестандартный заголовок превращал бы каждый запрос витрины в два (T-501).
 */
export function configureApi(): void {
  if (configured) return;
  configured = true;
  const baseUrl = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? DEV_API_URL : undefined);
  if (baseUrl) client.setConfig({ baseUrl });
  client.interceptors.request.use(async (request) => {
    if (!READ_METHODS.has(request.method)) request.headers.set('X-Requested-With', 'XMLHttpRequest');
    const token = getPreviewToken();
    const url = new URL(request.url);
    if (!token || !url.pathname.includes('/v1/storefront/')) return request;
    url.searchParams.set(PREVIEW_PARAM, token);
    // Тело переносим готовыми байтами: `new Request(url, request)` с телом-потоком Chrome отправляет потоком, а это
    // только по HTTP/2 — по HTTP/1.1 запрос падает с ERR_ALPN_NEGOTIATION_FAILED (pitfalls.md, T-501).
    const body = READ_METHODS.has(request.method) ? null : await request.arrayBuffer();
    return new Request(url, { method: request.method, headers: request.headers, body, signal: request.signal });
  });
}
