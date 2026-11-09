import { Module } from '@nestjs/common';

import { ShopController } from './shop.controller.js';
import { ShopService } from './shop.service.js';

/** Магазин владельца (FR-A2, FR-A8, FR-A9), тег контракта `shop`. */
@Module({
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
