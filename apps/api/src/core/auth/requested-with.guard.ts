import { Injectable, type CanActivate, type ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

import { AppError } from '../errors/index.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Изменяющие запросы обязаны слать заголовок `X-Requested-With` (api.md, «Вход») — простая защита от CSRF:
 * чужая страница не может добавить свой заголовок к запросу на другой адрес без разрешения CORS.
 * Значение не важно; фронты шлют `XMLHttpRequest`.
 */
@Injectable()
export class RequestedWithGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(req.method) || req.headers['x-requested-with']) return true;
    throw new AppError('forbidden', 403, { detail: 'X-Requested-With header is required' });
  }
}
