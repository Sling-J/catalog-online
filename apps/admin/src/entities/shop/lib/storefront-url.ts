/**
 * Адрес витрины магазина: `<поддомен>.<основной домен>` с протоколом страницы админки (админка — на `app.<домен>`).
 * Основной домен — VITE_ROOT_DOMAIN (по умолчанию localhost), порт — VITE_STOREFRONT_PORT: в разработке витрина
 * на своём порту (3000), в продакшене порта нет.
 */
export function storefrontUrl(subdomain: string, pageOrigin: string): string {
  const { protocol } = new URL(pageOrigin);
  const root = storefrontRootDomain();
  const port = import.meta.env.VITE_STOREFRONT_PORT ?? (import.meta.env.DEV ? '3000' : '');
  return `${protocol}//${subdomain}.${root}${port ? `:${port}` : ''}`;
}

/** Адрес для показа человеку: без протокола и порта. */
export function storefrontHost(url: string): string {
  return new URL(url).hostname;
}

/** Основной домен витрин для подписи «<адрес>.<домен>» в мастере. */
export function storefrontRootDomain(): string {
  return import.meta.env.VITE_ROOT_DOMAIN ?? 'localhost';
}
