import { Injectable, type OnModuleInit } from '@nestjs/common';

import { Jobs } from '../../../core/jobs/index.js';
import { ImportProcessingService } from '../import-processing.service.js';
import { APPLY_IMPORT, PARSE_IMPORT, PREVIEW_IMPORT } from '../lib/import-jobs.js';

/** Фоновые шаги импорта: чтение файла, проверка строк, запись в каталог. */
@Injectable()
export class ImportWorker implements OnModuleInit {
  constructor(
    private readonly jobs: Jobs,
    private readonly processing: ImportProcessingService,
  ) {}

  onModuleInit(): void {
    this.jobs.work(PARSE_IMPORT, (data, attempt) => this.processing.parse(data, attempt));
    this.jobs.work(PREVIEW_IMPORT, (data, attempt) => this.processing.preview(data, attempt));
    this.jobs.work(APPLY_IMPORT, (data, attempt) => this.processing.apply(data, attempt));
  }
}
