import { Module } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthMailWorker } from './workers/auth-mail.worker.js';

/** Вход магазина (FR-A1), тег контракта `auth`. Сессии и cookie — `core/auth`. */
@Module({
  controllers: [AuthController],
  providers: [AuthService, AuthMailWorker],
})
export class AuthModule {}
