import { Module, type DynamicModule } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_PIPE } from '@nestjs/core';

import { RequestedWithGuard, SessionModule } from './auth/index.js';
import { ConfigModule, type Config } from './config/index.js';
import { RequestContextModule } from './context/index.js';
import { DbModule } from './db/index.js';
import { ProblemFilter } from './errors/index.js';
import { HealthController } from './health/health.controller.js';
import { ImagesModule } from './images/index.js';
import { JobsModule } from './jobs/index.js';
import { LoggingModule } from './logging/index.js';
import { MailModule } from './mail/index.js';
import { RateLimitGuard, RateLimitModule } from './rate-limit/index.js';
import { StorageModule } from './storage/index.js';
import { ValidationPipe } from './validation/index.js';

/** Инфраструктура без бизнес-смысла (backend-structure.md, раздел 3). Подключается один раз в AppModule. */
@Module({})
export class CoreModule {
  static forRoot(config: Config): DynamicModule {
    return {
      module: CoreModule,
      imports: [
        ConfigModule.forRoot(config),
        LoggingModule,
        RequestContextModule,
        DbModule,
        RateLimitModule,
        MailModule,
        SessionModule,
        StorageModule,
        ImagesModule,
        JobsModule,
      ],
      controllers: [HealthController],
      providers: [
        { provide: APP_FILTER, useClass: ProblemFilter },
        { provide: APP_PIPE, useClass: ValidationPipe },
        // Порядок важен: сначала ограничение частоты, потом заголовок CSRF
        { provide: APP_GUARD, useClass: RateLimitGuard },
        { provide: APP_GUARD, useClass: RequestedWithGuard },
      ],
    };
  }
}
