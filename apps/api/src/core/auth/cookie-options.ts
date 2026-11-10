import type { CookieOptions } from 'express';

import type { AppConfig } from '../config/index.js';

/** Cookie сессий (`sid`, `staff_sid`): HttpOnly, SameSite=Lax, Secure в продакшене, родительский домен (api.md, «Вход»). */
export function sessionCookieOptions(config: AppConfig): CookieOptions {
  const domain = config.get('cookieDomain');
  return {
    httpOnly: true,
    secure: config.get('env') === 'production',
    sameSite: 'lax',
    path: '/',
    ...(domain ? { domain } : {}),
  };
}
