import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestUrl } from '@tanstack/react-start/server';

/**
 * Адрес сайта для канонических ссылок, Open Graph и sitemap: `https://<поддомен>.<домен>`.
 * На сервере — из запроса (за прокси — по заголовкам X-Forwarded-Host/Proto), в браузере — из адреса окна.
 */
export const getSiteOrigin = createIsomorphicFn()
  .server((): string => getRequestUrl({ xForwardedHost: true, xForwardedProto: true }).origin)
  .client((): string => window.location.origin);
