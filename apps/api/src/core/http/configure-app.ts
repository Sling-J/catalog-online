import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';

import type { Config } from '../config/index.js';
import { isAllowedOrigin } from './cors.js';

/**
 * Настройки HTTP поверх модулей — общие для `main.ts` и тестов, чтобы тесты проверяли тот же конвейер.
 * Фильтр ошибок, проверка входных данных и guards подключены в `CoreModule` (APP_FILTER, APP_PIPE, APP_GUARD).
 * Типы Express — только в core (решение 3 в backend-structure.md).
 */
export function configureApp(app: NestExpressApplication, config: Config): void {
  app.useLogger(app.get(Logger));
  app.disable('x-powered-by');
  app.set('trust proxy', config.trustProxy);
  app.enableCors({
    origin: (origin, callback) => callback(null, !origin || isAllowedOrigin(origin, config.corsOrigins)),
    credentials: true,
    maxAge: 600,
  });
  app.enableShutdownHooks();
}
