import { Module } from '@nestjs/common';

import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';

/** Категории (FR-A6), тег контракта `categories`. `CategoriesService` — товарам (проверка выбранной категории). */
@Module({
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
