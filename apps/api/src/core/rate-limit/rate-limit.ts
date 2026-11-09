import { Injectable, Module, type ExecutionContext } from '@nestjs/common';
import { SkipThrottle, Throttle, ThrottlerGuard, ThrottlerModule, type ThrottlerLimitDetail } from '@nestjs/throttler';
import type { Response } from 'express';

import { AppError } from '../errors/index.js';

/** Общий потолок на любой адрес с одного IP — защита от потока запросов. Строже — `@RateLimit()` на маршруте. */
const DEFAULT_LIMIT = { limit: 300, ttl: 60_000 };

/**
 * Строгое ограничение на маршрут или контроллер (api.md: вход, регистрация, письма, события витрины):
 * `@RateLimit(5, 60_000)` — не больше 5 запросов в минуту с одного IP.
 */
export const RateLimit = (limit: number, ttlMs: number) => Throttle({ default: { limit, ttl: ttlMs } });

/** Без ограничения частоты (служебные адреса). */
export const NoRateLimit = () => SkipThrottle();

/**
 * Превышение → 429 `rate_limited` с `Retry-After` в секундах. Сам throttler ставит `Retry-After` только для
 * набора с именем `default` и бросает своё исключение — задаём заголовок и ответ явно.
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  protected override async throwThrottlingException(
    context: ExecutionContext,
    detail: ThrottlerLimitDetail,
  ): Promise<void> {
    const res = context.switchToHttp().getResponse<Response>();
    res.setHeader('Retry-After', String(Math.max(1, Math.ceil(detail.timeToBlockExpire))));
    throw new AppError('rate_limited', 429);
  }
}

/** Счётчики в памяти процесса: API — один процесс (ADR 0004). Несколько процессов — хранилище в PostgreSQL. */
@Module({
  imports: [ThrottlerModule.forRoot({ throttlers: [{ name: 'default', ...DEFAULT_LIMIT }] })],
  exports: [ThrottlerModule],
})
export class RateLimitModule {}
