import { Global, Injectable, Module } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CLS_REQ, CLS_RES, ClsModule, ClsService, type ClsStore } from 'nestjs-cls';

import { AppError } from '../errors/index.js';

/** Сессия магазина, которую нашёл guard. */
export type AccountSession = {
  sessionId: string;
  accountId: string;
  shopId: string;
  /** Вход сотрудника «от имени» магазина (FR-S3). */
  impersonated: boolean;
};

interface ContextStore extends ClsStore {
  session?: AccountSession;
  staffId?: string;
  [CLS_REQ]: Request;
  [CLS_RES]: Response;
}

/**
 * Контекст запроса (AsyncLocalStorage через nestjs-cls, backend-structure.md, раздел 5): кто вошёл и какой
 * магазин. Заполняют guards сессий (`core/auth`). Читает только контроллер и явно передаёт `shopId`
 * в сервис — сервисы и репозитории контекст не читают.
 */
@Injectable()
export class RequestContext {
  constructor(private readonly cls: ClsService<ContextStore>) {}

  /** Сессия магазина; без неё — 401 (guard должен был не пустить раньше). */
  session(): AccountSession {
    const session = this.cls.get('session');
    if (!session) throw new AppError('unauthorized', 401);
    return session;
  }

  shopId(): string {
    return this.session().shopId;
  }

  accountId(): string {
    return this.session().accountId;
  }

  staffId(): string {
    const staffId = this.cls.get('staffId');
    if (!staffId) throw new AppError('unauthorized', 401);
    return staffId;
  }

  setSession(session: AccountSession): void {
    this.cls.set('session', session);
  }

  setStaff(staffId: string): void {
    this.cls.set('staffId', staffId);
  }

  /** User-Agent запроса (отсев ботов в статистике витрины); нет заголовка — пустая строка. */
  userAgent(): string {
    return this.request().headers['user-agent'] ?? '';
  }

  /** Запрос и ответ Express — только для core (cookie, заголовки); модули их не берут. */
  request(): Request {
    return this.cls.get(CLS_REQ);
  }

  response(): Response {
    return this.cls.get(CLS_RES);
  }
}

/** Глобальный: контекст нужен guards в любом модуле и контроллерам. */
@Global()
@Module({
  imports: [ClsModule.forRoot({ global: true, middleware: { mount: true, saveReq: true, saveRes: true } })],
  providers: [RequestContext],
  exports: [RequestContext],
})
export class RequestContextModule {}
