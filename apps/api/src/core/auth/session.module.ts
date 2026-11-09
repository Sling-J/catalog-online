import { Global, Module } from '@nestjs/common';

import { PreviewTokens } from './preview-token.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';

/** Сессии магазина для всех модулей: `@Authenticated()`, `SessionService` (вход, выход), токены превью витрины. */
@Global()
@Module({
  providers: [SessionService, SessionGuard, PreviewTokens],
  exports: [SessionService, SessionGuard, PreviewTokens],
})
export class SessionModule {}
