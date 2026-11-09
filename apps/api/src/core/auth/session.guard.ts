import { Injectable, UseGuards, type CanActivate } from '@nestjs/common';

import { RequestContext } from '../context/index.js';
import { AppError } from '../errors/index.js';
import { SessionService } from './session.service.js';

/** Пускает только с действующей сессией магазина и кладёт её в контекст запроса; иначе 401 `unauthorized`. */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly sessions: SessionService,
    private readonly ctx: RequestContext,
  ) {}

  async canActivate(): Promise<boolean> {
    const session = await this.sessions.resolve();
    if (!session) throw new AppError('unauthorized', 401);
    this.ctx.setSession(session);
    return true;
  }
}

/** Маршрут или контроллер только для вошедшего магазина: `@Authenticated()`. */
export const Authenticated = () => UseGuards(SessionGuard);
