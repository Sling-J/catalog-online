import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';

import { defineJob, Jobs } from '../../../core/jobs/index.js';
import { UploadsService } from '../uploads.service.js';

/** Уборка брошенных загрузок — по расписанию, раз в сутки. */
export const CLEANUP_UPLOADS = defineJob<Record<string, never>>('uploads.cleanup', { retryLimit: 1, retryDelay: 600 });

/** 21:30 UTC — 02:30 в Алматы, когда магазины не работают. */
const CLEANUP_CRON = '30 21 * * *';

@Injectable()
export class CleanupUploadsWorker implements OnModuleInit {
  private readonly logger = new Logger('CleanupUploads');

  constructor(
    private readonly jobs: Jobs,
    private readonly uploads: UploadsService,
  ) {}

  onModuleInit(): void {
    this.jobs.work(CLEANUP_UPLOADS, async () => {
      const removed = await this.uploads.cleanupAbandoned();
      this.logger.log({ removed }, 'Брошенные загрузки убраны');
    });
    this.jobs.schedule(CLEANUP_UPLOADS, CLEANUP_CRON);
  }
}
