import type { GetStatsData, Stats } from '@catalog/contract';
import type { StatsControllerMethods } from '@catalog/contract/nest';
import { zGetStatsQuery } from '@catalog/contract/zod';
import { Controller, Get, Query } from '@nestjs/common';

import { Authenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { StatsService } from './stats.service.js';

/** `/v1/admin/stats` (контракт, тег stats). Магазин — из сессии (API1). */
@Controller('v1/admin/stats')
@Authenticated()
export class StatsController implements StatsControllerMethods {
  constructor(
    private readonly stats: StatsService,
    private readonly ctx: RequestContext,
  ) {}

  @Get()
  getStats(@Query({ schema: zGetStatsQuery }) query?: GetStatsData['query']): Promise<Stats> {
    return this.stats.get(this.ctx.shopId(), query?.period ?? '7d');
  }
}
