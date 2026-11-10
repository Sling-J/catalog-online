import { Global, Module } from '@nestjs/common';

import { PreviewTokens } from './preview-token.js';
import { SessionGuard } from './session.guard.js';
import { SessionService } from './session.service.js';
import { StaffSessionGuard } from './staff-session.guard.js';
import { StaffSessionService } from './staff-session.service.js';

/**
 * Сессии для всех модулей: магазина (`@Authenticated()`, `SessionService` — вход, выход, вход «от имени»),
 * сотрудника (`@StaffAuthenticated()`, `StaffSessionService`), токены превью витрины.
 */
@Global()
@Module({
  providers: [SessionService, SessionGuard, StaffSessionService, StaffSessionGuard, PreviewTokens],
  exports: [SessionService, SessionGuard, StaffSessionService, StaffSessionGuard, PreviewTokens],
})
export class SessionModule {}
