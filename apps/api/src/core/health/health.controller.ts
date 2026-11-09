import { Controller, Get } from '@nestjs/common';
import { sql } from 'drizzle-orm';

import { InjectDb, type Db } from '../db/index.js';
import { NoRateLimit } from '../rate-limit/index.js';

/**
 * Служебная проверка «API жив и видит базу» — для деплоя и мониторинга. Вне контракта: фронтам не нужна
 * (решение основателя 2026-11-08, T-401). База недоступна → 500.
 */
@Controller('health')
@NoRateLimit()
export class HealthController {
  constructor(@InjectDb() private readonly db: Db) {}

  @Get()
  async check(): Promise<{ status: 'ok' }> {
    await this.db.execute(sql`select 1`);
    return { status: 'ok' };
  }
}
