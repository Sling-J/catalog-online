import { Injectable } from '@nestjs/common';
import type { CookieOptions } from 'express';

import { AppConfig } from '../config/index.js';
import { RequestContext, type AccountSession } from '../context/index.js';
import { InjectDb, type Db, type DbOrTx } from '../db/index.js';
import { sessionsRepository } from './sessions.repository.js';
import { hashToken, newToken, readCookie } from './tokens.js';

/** Cookie сессии магазина (api.md, «Вход»). */
export const SESSION_COOKIE = 'sid';
const DAY_MS = 86_400_000;
/** Вход живёт 30 дней и продлевается при заходе (решение основателя 2026-11-09, T-403). */
export const SESSION_TTL_MS = 30 * DAY_MS;
/** Продлеваем не чаще раза в сутки, чтобы не писать в базу на каждый запрос. */
const EXTEND_AFTER_MS = DAY_MS;

/**
 * Сессии магазина: открыть (cookie `sid`), найти по cookie, продлить, закрыть. В базе — только хеш токена.
 * Cookie пишется в ответ текущего запроса через контекст, поэтому методы контроллера не принимают `Response`
 * и совпадают с сигнатурами контракта.
 */
@Injectable()
export class SessionService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly config: AppConfig,
    private readonly ctx: RequestContext,
  ) {}

  /** Открыть сессию для аккаунта и поставить cookie. Возвращает id сессии (хеш). */
  async start(accountId: string, tx: DbOrTx = this.db): Promise<string> {
    const token = newToken();
    const id = hashToken(token);
    const req = this.ctx.request();
    await sessionsRepository.create(tx, {
      id,
      accountId,
      expiresAt: new Date(Date.now() + SESSION_TTL_MS),
      userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      ip: req.ip ?? null,
    });
    this.setCookie(token);
    return id;
  }

  /** Сессия по cookie текущего запроса (с продлением) или `null`. */
  async resolve(): Promise<AccountSession | null> {
    const req = this.ctx.request();
    const token = readCookie(req.headers.cookie, SESSION_COOKIE);
    if (!token) return null;
    const now = new Date();
    const row = await sessionsRepository.findActive(this.db, hashToken(token), now);
    if (!row) return null;
    if (row.expiresAt.getTime() - now.getTime() < SESSION_TTL_MS - EXTEND_AFTER_MS) {
      await sessionsRepository.extend(this.db, row.id, new Date(now.getTime() + SESSION_TTL_MS));
      this.setCookie(token);
    }
    return {
      sessionId: row.id,
      accountId: row.accountId,
      shopId: row.shopId,
      impersonated: row.impersonatedBy !== null,
    };
  }

  /** Закрыть текущую сессию и стереть cookie. */
  async end(sessionId: string): Promise<void> {
    await sessionsRepository.delete(this.db, sessionId);
    this.ctx.response().clearCookie(SESSION_COOKIE, this.cookieOptions());
  }

  /** Закрыть сессии аккаунта: все (сброс пароля) или кроме текущей (смена пароля). */
  async endForAccount(accountId: string, exceptSessionId?: string, tx: DbOrTx = this.db): Promise<void> {
    await sessionsRepository.deleteForAccount(tx, accountId, exceptSessionId);
  }

  private setCookie(token: string): void {
    this.ctx.response().cookie(SESSION_COOKIE, token, { ...this.cookieOptions(), maxAge: SESSION_TTL_MS });
  }

  private cookieOptions(): CookieOptions {
    const domain = this.config.get('cookieDomain');
    return {
      httpOnly: true,
      secure: this.config.get('env') === 'production',
      sameSite: 'lax',
      path: '/',
      ...(domain ? { domain } : {}),
    };
  }
}
