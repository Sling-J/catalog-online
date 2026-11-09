// `pnpm --filter @catalog/api storage:setup` — подготовить хранилище разработки (один раз, повторять можно):
// создать публичное и закрытое хранилища и разрешить загрузку из админки в закрытое (CORS для `PUT`).
// Анонимное чтение публичного в SeaweedFS задаётся его конфигом (infra/dev/seaweedfs-s3.json); у провайдера
// в продакшене — политикой хранилища (T-601).
import { CreateBucketCommand, PutBucketCorsCommand } from '@aws-sdk/client-s3';

import { loadConfig } from '../../config/index.js';
import { S3Storage } from '../storage.js';

const config = loadConfig();
const storage = new S3Storage(config.s3);

for (const bucket of [config.s3.publicBucket, config.s3.privateBucket]) {
  try {
    await storage.client.send(new CreateBucketCommand({ Bucket: bucket }));
    console.log(`Создано хранилище ${bucket}`);
  } catch (error) {
    const name = (error as { name?: string }).name;
    if (name !== 'BucketAlreadyOwnedByYou' && name !== 'BucketAlreadyExists') throw error;
    console.log(`Хранилище ${bucket} уже есть`);
  }
}

// браузер шлёт файл прямо в хранилище (API2) — с адреса админки и с адресов фронтов из CORS_ORIGINS
const origins = [...new Set([config.adminUrl, ...config.corsOrigins])];
await storage.client.send(
  new PutBucketCorsCommand({
    Bucket: config.s3.privateBucket,
    CORSConfiguration: {
      CORSRules: [{ AllowedOrigins: origins, AllowedMethods: ['PUT'], AllowedHeaders: ['*'], MaxAgeSeconds: 600 }],
    },
  }),
);
console.log(`Загрузка из браузера в ${config.s3.privateBucket} разрешена для: ${origins.join(', ')}`);
