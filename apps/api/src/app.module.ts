import { Module, type DynamicModule } from '@nestjs/common';

import type { Config } from './core/config/index.js';
import { CoreModule } from './core/core.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { ProductsModule } from './modules/products/products.module.js';
import { ShopModule } from './modules/shop/shop.module.js';
import { UploadsModule } from './modules/uploads/uploads.module.js';

/** Корень: core и модули предметных областей (по одному на тег контракта). */
@Module({})
export class AppModule {
  static forRoot(config: Config): DynamicModule {
    return {
      module: AppModule,
      imports: [CoreModule.forRoot(config), AuthModule, ShopModule, UploadsModule, ProductsModule],
    };
  }
}
