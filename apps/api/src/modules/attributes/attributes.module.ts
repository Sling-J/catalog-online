import { Module } from '@nestjs/common';

import { AttributesController } from './attributes.controller.js';
import { AttributesService } from './attributes.service.js';

/** Свойства вариантов (FR-A6), тег контракта `attributes`. `AttributesService` — товарам (значения таблицы размеров). */
@Module({
  controllers: [AttributesController],
  providers: [AttributesService],
  exports: [AttributesService],
})
export class AttributesModule {}
