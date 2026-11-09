import { createHash, randomBytes } from 'node:crypto';

/** Случайный токен для cookie сессии и ссылок из писем: 32 байта, base64url. */
export function newToken(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * В базе храним только хеш токена: утечка базы не даёт войти. SHA-256 достаточно — токен случайный и длинный,
 * перебирать его по словарю бессмысленно (в отличие от пароля, для которого argon2).
 */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Значение cookie по имени из заголовка `Cookie`. */
export function readCookie(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index === -1) continue;
    if (part.slice(0, index).trim() !== name) continue;
    const value = part.slice(index + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }
  return undefined;
}
