import { client } from '@catalog/contract';

// Адрес API: VITE_API_URL, иначе адрес из контракта (в разработке его перехватывает MSW).
export function configureApi(): void {
  const baseUrl = import.meta.env.VITE_API_URL;
  if (baseUrl) client.setConfig({ baseUrl });
}
