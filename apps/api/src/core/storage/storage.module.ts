import { Global, Module } from '@nestjs/common';

import { AppConfig } from '../config/index.js';
import { S3Storage, Storage } from './storage.js';

@Global()
@Module({
  providers: [
    { provide: Storage, inject: [AppConfig], useFactory: (config: AppConfig) => new S3Storage(config.get('s3')) },
  ],
  exports: [Storage],
})
export class StorageModule {}
