import 'reflect-metadata';

import type { Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module.js';
import { parseConfig, type Config } from '../../src/core/config/index.js';
import { configureApp } from '../../src/core/http/index.js';
import { Mailer, type MailMessage } from '../../src/core/mail/index.js';
import { Storage } from '../../src/core/storage/index.js';
import { MemoryStorage } from './storage.js';
import { createTestDatabase } from './db.js';

export const TEST_PUBLIC_URL = 'http://storage.test/catalog-public';
export const TEST_ADMIN_URL = 'http://app.localhost:3002';
export const TEST_CORS_ORIGINS = 'http://app.localhost:3002,http://*.localhost:3000';

export type TestApp = {
  app: NestExpressApplication;
  config: Config;
  /** Запросы supertest к поднятому приложению. */
  http: () => ReturnType<typeof request>;
  close: () => Promise<void>;
  /** Письма, которые «отправило» приложение (вместо SMTP и лога). */
  mails: MailMessage[];
  /** Хранилище в памяти вместо S3. */
  storage: MemoryStorage;
};

/** Почта тестов: письма складываются в массив. */
class TestMailer extends Mailer {
  constructor(readonly sent: MailMessage[]) {
    super();
  }

  async send(message: MailMessage): Promise<void> {
    this.sent.push(message);
  }
}

/**
 * Приложение целиком на своей базе (backend-structure.md, раздел 11) — тот же конвейер, что в `main.ts`.
 * `controllers` — служебные контроллеры теста (например, чтобы проверить core без модулей).
 */
export async function createTestApp(options: { controllers?: Type[] } = {}): Promise<TestApp> {
  const mails: MailMessage[] = [];
  const config = parseConfig({
    NODE_ENV: 'test',
    DATABASE_URL: await createTestDatabase(),
    CORS_ORIGINS: TEST_CORS_ORIGINS,
    LOG_LEVEL: 'silent',
    ADMIN_URL: TEST_ADMIN_URL,
    APP_SECRET: 'test-secret-test-secret-test-secret',
    S3_ENDPOINT: 'http://storage.test',
    S3_ACCESS_KEY: 'test',
    S3_SECRET_KEY: 'test',
    S3_PUBLIC_BUCKET: 'catalog-public',
    S3_PRIVATE_BUCKET: 'catalog-private',
    S3_PUBLIC_URL: TEST_PUBLIC_URL,
  });
  const storage = new MemoryStorage(config.s3);
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot(config)],
    controllers: options.controllers ?? [],
  })
    .overrideProvider(Mailer)
    .useValue(new TestMailer(mails))
    .overrideProvider(Storage)
    .useValue(storage)
    .compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
  configureApp(app, config);
  await app.init();
  return {
    app,
    config,
    http: () => request(app.getHttpServer()),
    close: () => app.close(),
    mails,
    storage,
  };
}
