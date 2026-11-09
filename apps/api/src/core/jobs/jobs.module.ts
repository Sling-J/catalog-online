import { Global, Module } from '@nestjs/common';

import { Jobs } from './jobs.js';
import { PgBossJobs } from './pg-boss-jobs.js';

@Global()
@Module({
  providers: [{ provide: Jobs, useClass: PgBossJobs }],
  exports: [Jobs],
})
export class JobsModule {}
