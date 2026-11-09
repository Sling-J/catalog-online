import { Module } from '@nestjs/common';

import { UploadsController } from './uploads.controller.js';
import { UploadsService } from './uploads.service.js';

/** Загрузка файлов в хранилище (API2), тег контракта `uploads`. `UploadsService.consume` — для других модулей. */
@Module({
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
