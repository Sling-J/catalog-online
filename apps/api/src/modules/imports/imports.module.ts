import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { ImportProcessingService } from './import-processing.service.js';
import { ImportsController } from './imports.controller.js';
import { ImportsService } from './imports.service.js';
import { ImportWorker } from './workers/import.worker.js';

/** Импорт Excel/CSV (FR-A3), тег контракта `imports`. В каталог пишет через `ProductImportService` модуля товаров. */
@Module({
  imports: [UploadsModule, ProductsModule],
  controllers: [ImportsController],
  providers: [ImportsService, ImportProcessingService, ImportWorker],
})
export class ImportsModule {}
