import { Injectable } from '@nestjs/common';

import { AppConfig } from '../config/index.js';
import { RequestContext } from '../context/index.js';
import { InjectDb, type Db } from '../db/index.js';
import { sessionCookieOptions } from './cookie-options.js';
import { staffSessionsRepository } from './staff-sessions.repository.js';
import { hashToken, newToken, readCookie } from './tokens.js';

/** Cookie сессии сотрудника суперадминки (api.md, «Вход») — отдельно от `sid` магазина. */
export const STAFF_SESSION_COOKIE = 'staff_sid';
/** Рабочий день без продления: доступ ко всем магазинам (решение основателя 2026-11-10, T-412). */
export const STAFF_SESSION_TTL_MS = 12 * 60 * 60_000;

/** Сессии сотрудников: открыть (cookie `staff_sid`) и найти по cookie. В базе — только хеш токена. */
@Injectable()
export class StaffSessionService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly config: AppConfig,
    private readonly ctx: RequestContext,
  ) {}

  async start(staffUserId: string): Promise<void> {
    const token = newToken();
    const req = this.ctx.request();
    await staffSessionsRepository.create(this.db, {
      id: hashToken(token),
      staffUserId,
      expiresAt: new Date(Date.now() + STAFF_SESSION_TTL_MS),
      userAgent: req.headers['user-agent']?.slice(0, 500) ?? null,
      ip: req.ip ?? null,
    });
    this.ctx
      .response()
      .cookie(STAFF_SESSION_COOKIE, token, { ...sessionCookieOptions(this.config), maxAge: STAFF_SESSION_TTL_MS });
  }

  /** Сотрудник по cookie текущего запроса или `null`. */
  async resolve(): Promise<string | null> {
    const token = readCookie(this.ctx.request().headers.cookie, STAFF_SESSION_COOKIE);
    if (!token) return null;
    return staffSessionsRepository.findActive(this.db, hashToken(token), new Date());
  }
}
