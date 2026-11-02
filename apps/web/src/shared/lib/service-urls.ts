const ADMIN_DEV_PORT = 3002;

/**
 * Адреса частей сервиса от адреса текущей страницы: админка на поддомене `app`, демо-магазин на своём поддомене
 * (`aigerim-kids` по умолчанию), всё — того же основного домена, протокола и порта. Переопределяются
 * VITE_ADMIN_ORIGIN и VITE_DEMO_SHOP. В разработке админка — на своём порту: app.<домен>:3002 (apps/admin).
 */
export function serviceUrls(origin: string): { admin: string; register: string; demoShop: string } {
  const { protocol, port } = new URL(origin);
  const root = import.meta.env.VITE_ROOT_DOMAIN ?? 'localhost';
  const host = (subdomain: string) => `${protocol}//${subdomain}.${root}${port ? `:${port}` : ''}`;
  const admin =
    import.meta.env.VITE_ADMIN_ORIGIN ||
    (import.meta.env.DEV ? `${protocol}//app.${root}:${ADMIN_DEV_PORT}` : host('app'));
  return {
    admin,
    // регистрация в админке (FR-A1, T-302)
    register: `${admin}/register`,
    demoShop: host(import.meta.env.VITE_DEMO_SHOP || 'aigerim-kids'),
  };
}
