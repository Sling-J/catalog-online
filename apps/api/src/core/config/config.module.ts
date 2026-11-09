import { Global, Module, type DynamicModule } from '@nestjs/common';

import type { Config } from './config.js';

/** Конфиг приложения как провайдер: `constructor(private readonly config: AppConfig)`. */
export class AppConfig {
  constructor(readonly values: Config) {}

  get<K extends keyof Config>(key: K): Config[K] {
    return this.values[key];
  }
}

@Global()
@Module({})
export class ConfigModule {
  static forRoot(config: Config): DynamicModule {
    return {
      module: ConfigModule,
      providers: [{ provide: AppConfig, useValue: new AppConfig(config) }],
      exports: [AppConfig],
    };
  }
}
