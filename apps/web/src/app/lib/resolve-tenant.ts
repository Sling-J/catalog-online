import type { Tenant } from './tenant.types';

// Поддомены сервиса, которые не могут быть витриной магазина (админка, API).
const RESERVED_SUBDOMAINS = new Set(['app', 'api']);

/**
 * Определяет по заголовку Host, что открыто: лендинг сервиса (основной домен), витрина магазина
 * (`<поддомен>.<основной домен>`) или чужой адрес. Порт игнорируется.
 */
export function resolveTenant(host: string | null | undefined, rootDomain: string): Tenant {
  const hostname = (host ?? '').toLowerCase().replace(/:\d+$/, '');
  const root = rootDomain.toLowerCase();

  if (hostname === root || hostname === `www.${root}`) return { kind: 'landing' };
  if (!hostname.endsWith(`.${root}`)) return { kind: 'unknown' };

  const subdomain = hostname.slice(0, -(root.length + 1));
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/.test(subdomain) || RESERVED_SUBDOMAINS.has(subdomain)) {
    return { kind: 'unknown' };
  }
  return { kind: 'shop', subdomain };
}
