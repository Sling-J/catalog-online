import { Module, type DynamicModule } from '@nestjs/common';

import type { Config } from './core/config/index.js';
import { CoreModule } from './core/core.module.js';

/** Корень: core и модули предметных областей (по одному на тег контракта, появятся с T-403). */
@Module({})
export class AppModule {
  static forRoot(config: Config): DynamicModule {
    return {
      module: AppModule,
      imports: [CoreModule.forRoot(config)],
    };
  }
}
