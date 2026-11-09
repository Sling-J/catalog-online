import { Module } from '@nestjs/common';

import { ProductPhotosService } from './product-photos.service.js';
import { ProcessPhotoWorker } from './workers/process-photo.worker.js';

/**
 * Товары (FR-A1, FR-A4), тег контракта `products`. Пока — только фоновая обработка фото (T-406); эндпоинты
 * товаров и фото — T-407.
 */
@Module({
  providers: [ProductPhotosService, ProcessPhotoWorker],
  exports: [ProductPhotosService],
})
export class ProductsModule {}
