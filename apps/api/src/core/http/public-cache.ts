import {
  applyDecorators,
  Injectable,
  UseInterceptors,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { tap, type Observable } from 'rxjs';

/**
 * Сколько браузер (и позже CDN) держит ответ чтения витрины (T-611, scaling.md SC8): 30 с — свежий, ещё 5 минут —
 * отдаётся сразу, а в фоне перечитывается. Правка в админке видна покупателю не позже чем через 30 с (плюс один
 * показ устаревшего, если вкладка открыта дольше); остатки при заказе проверяет `cart/check` (POST, не кешируется).
 */
export const PUBLIC_CACHE = 'public, max-age=30, stale-while-revalidate=300';
/** Превью (`?preview=<токен>`) показывает черновик владельцу — не хранить нигде. */
export const NO_STORE = 'private, no-store';

/** Ставит `Cache-Control` только успешному ответу: ошибки (404 закрытого магазина и т. п.) не кешируются. */
@Injectable()
class PublicCacheInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const preview = typeof req.query['preview'] === 'string' && req.query['preview'] !== '';
    return next.handle().pipe(
      tap(() => {
        if (!res.headersSent) res.setHeader('Cache-Control', preview ? NO_STORE : PUBLIC_CACHE);
      }),
    );
  }
}

/** Публичное чтение, которое можно кешировать (`GET` витрины); с `?preview=` — `no-store`. */
export const PublicCache = () => applyDecorators(UseInterceptors(PublicCacheInterceptor));
