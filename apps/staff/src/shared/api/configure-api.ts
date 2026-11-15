import { client } from '@catalog/contract';

let configured = false;

/**
 * Адрес API: VITE_API_URL, иначе адрес самой суперадминки — в разработке Vite пересылает `/v1` на API
 * (`vite.config.ts`). Сессия сотрудника — cookie `staff_sid`, поэтому `credentials: 'include'`; `X-Requested-With`
 * API требует у изменяющих запросов (api.md, «Вход»).
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
