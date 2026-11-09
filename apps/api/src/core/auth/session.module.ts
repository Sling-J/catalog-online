import { Global, Module } from '@nestjs/common';

import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';

/** Сессии магазина для всех модулей: `@Authenticated()` и `SessionService` (вход, выход). */
@Global()
@Module({
  providers: [SessionService, SessionGuard],
  exports: [SessionService, SessionGuard],
})
export class SessionModule {}
