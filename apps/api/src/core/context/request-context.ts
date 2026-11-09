import { Injectable, Module } from '@nestjs/common';
import { ClsModule, ClsService, type ClsStore } from 'nestjs-cls';

import { AppError } from '../errors/index.js';

interface ContextStore extends ClsStore {
  accountId?: string;
  shopId?: string;
  staffId?: string;
}

/**
 * Контекст запроса (AsyncLocalStorage через nestjs-cls, backend-structure.md, раздел 5): кто вошёл и какой
 * магазин. Заполняют guards сессий (T-403, T-412). Читает только контроллер и явно передаёт `shopId`
 * в сервис — сервисы и репозитории контекст не читают.
 */
@Injectable()
export class RequestContext {
  constructor(private readonly cls: ClsService<ContextStore>) {}

  /** Магазин из сессии; без сессии — 401 (guard должен был не пустить раньше). */
  shopId(): string {
    const shopId = this.cls.get('shopId');
    if (!shopId) throw new AppError('unauthorized', 401);
    return shopId;
  }

  accountId(): string {
    const accountId = this.cls.get('accountId');
    if (!accountId) throw new AppError('unauthorized', 401);
    return accountId;
  }

  staffId(): string {
    const staffId = this.cls.get('staffId');
    if (!staffId) throw new AppError('unauthorized', 401);
    return staffId;
  }

  setAccount(accountId: string, shopId: string): void {
    this.cls.set('accountId', accountId);
    this.cls.set('shopId', shopId);
  }

  setStaff(staffId: string): void {
    this.cls.set('staffId', staffId);
  }
}

@Module({
  imports: [ClsModule.forRoot({ global: true, middleware: { mount: true } })],
  providers: [RequestContext],
  exports: [RequestContext],
})
export class RequestContextModule {}
