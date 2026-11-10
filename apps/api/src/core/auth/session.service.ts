import { Injectable } from '@nestjs/common';
import type { CookieOptions } from 'express';

import { AppConfig } from '../config/index.js';
import { RequestContext, type AccountSession } from '../context/index.js';
import { InjectDb, type Db, type DbOrTx } from '../db/index.js';
import { sessionCookieOptions } from './cookie-options.js';
import { sessionsRepository } from './sessions.repository.js';
import { hashToken, newToken, readCookie } from './tokens.js';

/** Cookie сессии магазина (api.md, «Вход»). */
export const SESSION_COOKIE = 'sid';
const DAY_MS = 86_400_000;
/** Вход живёт 30 дней и продлевается при заходе (решение основателя 2026-11-09, T-403). */
export const SESSION_TTL_MS = 30 * DAY_MS;
/** Вход сотрудника «от имени» магазина — 2 часа без продления (решение основателя 2026-11-10, T-412). */
export const IMPERSONATION_TTL_MS = 2 * 60 * 60_000;
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
    return this.open(accountId, null, SESSION_TTL_MS, tx);
  }

  /** Вход сотрудника «от имени» магазина (FR-S3): сессия с отметкой `impersonatedBy`, короткая и без продления. */
  async startImpersonated(accountId: string, staffId: string, tx: DbOrTx = this.db): Promise<string> {
    return this.open(accountId, staffId, IMPERSONATION_TTL_MS, tx);
  }

  private async open(accountId: string, impersonatedBy: string | null, ttlMs: number, tx: DbOrTx): Promise<string> {
    const token = newToken();
    const id = hashToken(token);
    const req = this.ctx.request();
    await sessionsRepository.create(tx, {
      id,
      accountId,
      impersonatedBy,
      expiresAt: new Date(Date.now() + ttlMs),
      userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      ip: req.ip ?? null,
    });
    this.setCookie(token, ttlMs);
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
    if (row.impersonatedBy === null && row.expiresAt.getTime() - now.getTime() < SESSION_TTL_MS - EXTEND_AFTER_MS) {
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

  private setCookie(token: string, maxAge = SESSION_TTL_MS): void {
    this.ctx.response().cookie(SESSION_COOKIE, token, { ...this.cookieOptions(), maxAge });
  }

  private cookieOptions(): CookieOptions {
    return sessionCookieOptions(this.config);
  }
}
