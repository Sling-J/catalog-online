import { describe, expect, it } from 'vitest';

import { AppConfig, parseConfig } from '../config/index.js';
import { PREVIEW_TOKEN_TTL_MS, PreviewTokens } from './preview-token.js';

const configWith = (secret: string) =>
  new AppConfig(
    parseConfig({
      DATABASE_URL: 'postgres://x:y@localhost/db',
      CORS_ORIGINS: 'http://localhost',
      ADMIN_URL: 'http://localhost',
      APP_SECRET: secret,
    }),
  );

describe('PreviewTokens', () => {
  const tokens = new PreviewTokens(configWith('a'.repeat(32)));
  const shopId = '0192d000-0000-7000-8000-00000000a001';
  const now = Date.parse('2026-11-09T12:00:00Z');

  it('выдаёт токен на 30 минут и узнаёт магазин', () => {
    const { token, expiresAt } = tokens.issue(shopId, now);
    expect(expiresAt.getTime() - now).toBe(PREVIEW_TOKEN_TTL_MS);
    expect(tokens.verify(token, now + 60_000)).toBe(shopId);
  });

  it('просроченный, подделанный и с чужим секретом — null', () => {
    const { token } = tokens.issue(shopId, now);
    expect(tokens.verify(token, now + PREVIEW_TOKEN_TTL_MS + 1000)).toBeNull();

    const [body, signature] = token.split('.');
    const forged = Buffer.from(JSON.stringify({ s: 'other-shop', e: 9_999_999_999 })).toString('base64url');
    expect(tokens.verify(`${forged}.${signature}`, now)).toBeNull();
    expect(tokens.verify(`${body}.x${signature}`, now)).toBeNull();
    expect(new PreviewTokens(configWith('b'.repeat(32))).verify(token, now)).toBeNull();
    expect(tokens.verify('demo', now)).toBeNull();
  });
});
