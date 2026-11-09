import { client } from '@catalog/contract';

let configured = false;

/**
 * Адрес API: VITE_API_URL, иначе адрес из контракта (в разработке его перехватывает MSW).
 * Сессия — в cookie (API1), поэтому запросы идут с `credentials: 'include'`: API на другом поддомене.
 * `X-Requested-With` API требует у изменяющих запросов — защита от CSRF (api.md, «Вход»).
 */
export function configureApi(): void {
  if (configured) return;
  configured = true;
  const baseUrl = import.meta.env.VITE_API_URL;
  client.setConfig({
    credentials: 'include',
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
    ...(baseUrl ? { baseUrl } : {}),
  });
}
