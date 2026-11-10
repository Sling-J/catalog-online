import { Module } from '@nestjs/common';

import { AttributesModule } from '../attributes/attributes.module.js';
import { CategoriesModule } from '../categories/categories.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { ProductImportService } from './product-import.service.js';
import { ProductPhotosService } from './product-photos.service.js';
import { ProductVariantsService } from './product-variants.service.js';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { ProcessPhotoWorker } from './workers/process-photo.worker.js';

/**
 * Товары (FR-A5, FR-A4), тег контракта `products`. `ProductsService` — для чек-листа магазина,
 * `ProductImportService` — для модуля импорта.
 */
@Module({
  imports: [UploadsModule, CategoriesModule, AttributesModule],
  controllers: [ProductsController],
  providers: [ProductsService, ProductVariantsService, ProductPhotosService, ProductImportService, ProcessPhotoWorker],
  exports: [ProductsService, ProductImportService],
})
export class ProductsModule {}
