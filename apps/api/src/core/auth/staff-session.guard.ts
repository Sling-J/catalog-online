import { Injectable, UseGuards, type CanActivate } from '@nestjs/common';

import { RequestContext } from '../context/index.js';
import { AppError } from '../errors/index.js';
import { StaffSessionService } from './staff-session.service.js';

/** Пускает только с действующей сессией сотрудника и кладёт его в контекст запроса; иначе 401. */
@Injectable()
export class StaffSessionGuard implements CanActivate {
  constructor(
    private readonly sessions: StaffSessionService,
    private readonly ctx: RequestContext,
  ) {}

  async canActivate(): Promise<boolean> {
    const staffId = await this.sessions.resolve();
    if (!staffId) throw new AppError('unauthorized', 401);
    this.ctx.setStaff(staffId);
    return true;
  }
}

/** Маршрут или контроллер только для вошедшего сотрудника суперадминки: `@StaffAuthenticated()`. */
export const StaffAuthenticated = () => UseGuards(StaffSessionGuard);
