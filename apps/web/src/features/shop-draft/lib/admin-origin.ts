/**
 * Откуда админка присылает правки превью. По умолчанию — поддомен `app` основного домена с тем же портом
 * и протоколом (`https://app.<домен>`); VITE_ADMIN_ORIGIN задаёт адрес явно (в разработке админка на своём порту).
 */
export function adminOrigin(location: Pick<Location, 'protocol' | 'port'>): string {
  const explicit = import.meta.env.VITE_ADMIN_ORIGIN;
  if (explicit) return explicit;
  const root = import.meta.env.VITE_ROOT_DOMAIN ?? 'localhost';
  return `${location.protocol}//app.${root}${location.port ? `:${location.port}` : ''}`;
}
