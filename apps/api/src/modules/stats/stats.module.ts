import { Module } from '@nestjs/common';

import { StatsController } from './stats.controller.js';
import { StatsService } from './stats.service.js';

/** Статистика витрины (FR-A10), тег контракта `stats`. `StatsService.record` — для событий витрины. */
@Module({
  controllers: [StatsController],
  providers: [StatsService],
  exports: [StatsService],
})
export class StatsModule {}
