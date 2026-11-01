import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeader } from '@tanstack/react-start/server';

import { resolveTenant } from './resolve-tenant';
import type { Tenant } from './tenant.types';

// Основной домен сервиса: в разработке localhost (витрина — <поддомен>.localhost:3000).
const ROOT_DOMAIN = import.meta.env.VITE_ROOT_DOMAIN ?? 'localhost';

// На сервере (SSR) магазин определяется по заголовку Host запроса, в браузере — по адресу страницы.
export const getTenant = createIsomorphicFn()
  .server((): Tenant => resolveTenant(getRequestHeader('host'), ROOT_DOMAIN))
  .client((): Tenant => resolveTenant(window.location.host, ROOT_DOMAIN));
