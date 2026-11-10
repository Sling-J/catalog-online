import { Module } from '@nestjs/common';

import { StatsModule } from '../stats/stats.module.js';
import { StorefrontController } from './storefront.controller.js';
import { StorefrontService } from './storefront.service.js';

/**
 * Публичная витрина (FR-V1–V7), тег контракта `storefront`. Таблицы магазина и каталога только читает своими
 * запросами — витрине нужны свои выборки (backend-structure.md, раздел 4). События отдаёт в модуль статистики.
 */
@Module({
  imports: [StatsModule],
  controllers: [StorefrontController],
  providers: [StorefrontService],
})
export class StorefrontModule {}
