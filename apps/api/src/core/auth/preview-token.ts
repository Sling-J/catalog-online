import { createHmac, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import { AppConfig } from '../config/index.js';

/** Сколько живёт ссылка превью неопубликованной витрины (A7), как в моках. */
export const PREVIEW_TOKEN_TTL_MS = 30 * 60_000;

type Payload = { s: string; e: number };

/**
 * Токен превью витрины без таблицы (решение основателя 2026-11-09, T-404): внутри — магазин и срок, подпись
 * HMAC-SHA256 секретом `APP_SECRET`. Выдаёт модуль магазина, проверяет витрина (T-410). Отозвать досрочно нельзя —
 * для 30 минут это не нужно.
 */
@Injectable()
export class PreviewTokens {
  constructor(private readonly config: AppConfig) {}

  issue(shopId: string, now = Date.now()): { token: string; expiresAt: Date } {
    const expiresAt = new Date(now + PREVIEW_TOKEN_TTL_MS);
    const payload: Payload = { s: shopId, e: Math.floor(expiresAt.getTime() / 1000) };
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return { token: `${body}.${this.sign(body)}`, expiresAt };
  }

  /** Магазин из действующего токена или `null` (подделка, просрочен, мусор). */
  verify(token: string, now = Date.now()): string | null {
    const [body, signature, ...rest] = token.split('.');
    if (!body || !signature || rest.length) return null;
    const expected = Buffer.from(this.sign(body));
    const actual = Buffer.from(signature);
    if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
    try {
      const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as Partial<Payload>;
      if (typeof payload.s !== 'string' || typeof payload.e !== 'number') return null;
      return payload.e * 1000 > now ? payload.s : null;
    } catch {
      return null;
    }
  }

  private sign(body: string): string {
    return createHmac('sha256', this.config.get('appSecret')).update(`preview.${body}`).digest('base64url');
  }
}
