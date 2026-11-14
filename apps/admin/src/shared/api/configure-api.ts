import { client } from '@catalog/contract';

let configured = false;

/**
 * Адрес API: VITE_API_URL, иначе адрес самой админки — в разработке Vite пересылает `/v1` на API (`vite.config.ts`),
 * поэтому cookie сессии первая сторона и CORS не нужен (решение основателя 2026-11-14, T-501). Моки MSW перехватывают
 * запросы по любому адресу.
 * Сессия — в cookie (API1), поэтому запросы идут с `credentials: 'include'`: API на другом поддомене.
 * `X-Requested-With` API требует у изменяющих запросов — защита от CSRF (api.md, «Вход»).
 */
export function configureApi(): void {
  if (configured) return;
  configured = true;
  client.setConfig({
    baseUrl: import.meta.env.VITE_API_URL || window.location.origin,
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
}
