import 'reflect-metadata';

import type { Type } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import request from 'supertest';

import { AppModule } from '../../src/app.module.js';
import { parseConfig, type Config } from '../../src/core/config/index.js';
import { configureApp } from '../../src/core/http/index.js';
import { createTestDatabase } from './db.js';

export const TEST_CORS_ORIGINS = 'http://app.localhost:3002,http://*.localhost:3000';

export type TestApp = {
  app: NestExpressApplication;
  config: Config;
  /** Запросы supertest к поднятому приложению. */
  http: () => ReturnType<typeof request>;
  close: () => Promise<void>;
};

/**
 * Приложение целиком на своей базе (backend-structure.md, раздел 11) — тот же конвейер, что в `main.ts`.
 * `controllers` — служебные контроллеры теста (например, чтобы проверить core без модулей).
 */
export async function createTestApp(options: { controllers?: Type[] } = {}): Promise<TestApp> {
  const config = parseConfig({
    NODE_ENV: 'test',
    DATABASE_URL: await createTestDatabase(),
    CORS_ORIGINS: TEST_CORS_ORIGINS,
    LOG_LEVEL: 'silent',
  });
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule.forRoot(config)],
    controllers: options.controllers ?? [],
  }).compile();
  const app = moduleRef.createNestApplication<NestExpressApplication>({ bufferLogs: true });
  configureApp(app, config);
  await app.init();
  return {
    app,
    config,
    http: () => request(app.getHttpServer()),
    close: () => app.close(),
  };
}
