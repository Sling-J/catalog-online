import { Injectable, type OnModuleInit } from '@nestjs/common';

import { Jobs } from '../../../core/jobs/index.js';
import { AuthService } from '../auth.service.js';
import { AUTH_MAIL } from '../lib/auth-mail-job.js';

/** Письма входа (T-609, scaling.md SC6): выполняет процесс задач, API их только ставит. */
@Injectable()
export class AuthMailWorker implements OnModuleInit {
  constructor(
    private readonly jobs: Jobs,
    private readonly auth: AuthService,
  ) {}

  onModuleInit(): void {
    this.jobs.work(AUTH_MAIL, (data, attempt) => this.auth.sendAuthMail(data, attempt));
  }
}
