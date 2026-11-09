import { Injectable, type OnModuleInit } from '@nestjs/common';

import { Jobs } from '../../../core/jobs/index.js';
import { PROCESS_PHOTO } from '../lib/photo-jobs.js';
import { ProductPhotosService } from '../product-photos.service.js';

@Injectable()
export class ProcessPhotoWorker implements OnModuleInit {
  constructor(
    private readonly jobs: Jobs,
    private readonly photos: ProductPhotosService,
  ) {}

  onModuleInit(): void {
    this.jobs.work(PROCESS_PHOTO, (data, attempt) => this.photos.process(data, attempt));
  }
}
