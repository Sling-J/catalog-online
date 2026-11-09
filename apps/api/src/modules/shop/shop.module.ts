import { Module } from '@nestjs/common';

import { ProductsModule } from '../products/products.module.js';
import { UploadsModule } from '../uploads/uploads.module.js';
import { ShopController } from './shop.controller.js';
import { ShopService } from './shop.service.js';

/** Магазин владельца (FR-A2, FR-A8, FR-A9), тег контракта `shop`. */
@Module({
  imports: [UploadsModule, ProductsModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
