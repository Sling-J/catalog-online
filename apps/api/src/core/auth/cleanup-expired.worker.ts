import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';

import { InjectDb, type Db } from '../db/index.js';
import { defineJob, Jobs } from '../jobs/index.js';
import { expiredRepository } from './expired.repository.js';

/** Уборка просроченных сессий и токенов — по расписанию, раз в сутки (T-610, scaling.md SC14). */
export const CLEANUP_EXPIRED = defineJob<Record<string, never>>('auth.cleanup', { retryLimit: 1, retryDelay: 600 });

/** 21:00 UTC — 02:00 в Алматы, за полчаса до уборки загрузок (`uploads.cleanup`). */
const CLEANUP_CRON = '0 21 * * *';

@Injectable()
export class CleanupExpiredWorker implements OnModuleInit {
  private readonly logger = new Logger('CleanupExpired');

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly jobs: Jobs,
  ) {}

  onModuleInit(): void {
    this.jobs.work(CLEANUP_EXPIRED, async () => {
      const removed = await expiredRepository.deleteExpired(this.db, new Date());
      this.logger.log(removed, 'Просроченные сессии и токены убраны');
    });
    this.jobs.schedule(CLEANUP_EXPIRED, CLEANUP_CRON);
  }
}
