import { Injectable, type OnModuleInit } from '@nestjs/common';

import { defineJob, Jobs } from '../../../core/jobs/index.js';
import { ProductPhotosService, type ProcessPhotoData } from '../product-photos.service.js';

/**
 * Сжать фото товара. Ставится вместе с записью фото, в той же транзакции (T-407, `addProductPhoto`).
 * Три попытки с нарастающей паузой (10 с, 20 с…), одна попытка — не дольше 5 минут.
 */
export const PROCESS_PHOTO = defineJob<ProcessPhotoData>('photos.process', {
  retryLimit: 2,
  retryDelay: 10,
  retryBackoff: true,
  expireInSeconds: 5 * 60,
});

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
