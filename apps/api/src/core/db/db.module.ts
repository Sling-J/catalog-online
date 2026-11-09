import { Global, Inject, Injectable, Module, type OnApplicationShutdown } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

import { AppConfig } from '../config/index.js';
import * as schema from './schema/index.js';
import type { Db } from './types.js';

export const DB = Symbol('DB');
const SQL_CLIENT = Symbol('SQL_CLIENT');

/** Внедрить подключение: `constructor(@InjectDb() private readonly db: Db)`. */
export const InjectDb = () => Inject(DB);

/** Закрывает пул подключений при остановке приложения. */
@Injectable()
class SqlClientCloser implements OnApplicationShutdown {
  constructor(@Inject(SQL_CLIENT) private readonly sql: postgres.Sql) {}

  async onApplicationShutdown(): Promise<void> {
    await this.sql.end({ timeout: 5 });
  }
}

@Global()
@Module({
  providers: [
    {
      provide: SQL_CLIENT,
      inject: [AppConfig],
      // postgres.js подключается лениво — при первом запросе, а не при старте
      useFactory: (config: AppConfig) => postgres(config.get('databaseUrl'), { onnotice: () => {} }),
    },
    {
      provide: DB,
      inject: [SQL_CLIENT],
      useFactory: (sql: postgres.Sql): Db => drizzle({ client: sql, schema, casing: 'snake_case' }),
    },
    SqlClientCloser,
  ],
  exports: [DB],
})
export class DbModule {}
