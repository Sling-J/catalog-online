import { describe, expect, it } from 'vitest';

import { parseConfig } from './config.js';

const base = {
  DATABASE_URL: 'postgres://catalog:catalog@localhost:5432/catalog',
  CORS_ORIGINS: 'http://app.localhost:3002, http://*.localhost:3000',
  ADMIN_URL: 'http://app.localhost:3002/',
  APP_SECRET: 'x'.repeat(32),
  S3_ENDPOINT: 'http://localhost:8333',
  S3_ACCESS_KEY: 'key',
  S3_SECRET_KEY: 'secret',
  S3_PUBLIC_BUCKET: 'catalog-public',
  S3_PRIVATE_BUCKET: 'catalog-private',
  S3_PUBLIC_URL: 'http://localhost:8333/catalog-public/',
};

describe('parseConfig', () => {
  it('умолчания и разбор списка адресов', () => {
    expect(parseConfig(base)).toEqual({
      env: 'development',
      // роль в очереди задаёт точка входа: из окружения — всегда API
      jobsRole: 'enqueue',
      port: 3001,
      databaseUrl: base.DATABASE_URL,
      corsOrigins: ['http://app.localhost:3002', 'http://*.localhost:3000'],
      logLevel: 'info',
      trustProxy: 0,
      adminUrl: 'http://app.localhost:3002',
      cookieDomain: undefined,
      smtpUrl: undefined,
      mailFrom: 'Каталог <no-reply@localhost>',
      mailOutboxDir: undefined,
      rateLimits: true,
      appSecret: 'x'.repeat(32),
      s3: {
        endpoint: 'http://localhost:8333',
        region: 'us-east-1',
        accessKey: 'key',
        secretKey: 'secret',
        publicBucket: 'catalog-public',
        privateBucket: 'catalog-private',
        publicUrl: 'http://localhost:8333/catalog-public',
      },
    });
  });

  it('строки окружения приводятся к числам', () => {
    expect(parseConfig({ ...base, API_PORT: '4000', TRUST_PROXY: '1' })).toMatchObject({ port: 4000, trustProxy: 1 });
  });

  it('папка писем и выключенные лимиты — только не в продакшене (e2e, T-502)', () => {
    expect(parseConfig({ ...base, MAIL_OUTBOX_DIR: '.mail', RATE_LIMITS: 'off' })).toMatchObject({
      mailOutboxDir: '.mail',
      rateLimits: false,
    });
    expect(() => parseConfig({ ...base, NODE_ENV: 'production', MAIL_OUTBOX_DIR: '.mail' })).toThrow(/MAIL_OUTBOX_DIR/);
    expect(() => parseConfig({ ...base, NODE_ENV: 'production', RATE_LIMITS: 'off' })).toThrow(/RATE_LIMITS/);
  });

  it('нет обязательных переменных — понятная ошибка со списком', () => {
    expect(() => parseConfig({})).toThrow(/DATABASE_URL[\s\S]*CORS_ORIGINS[\s\S]*ADMIN_URL[\s\S]*APP_SECRET/);
    expect(() => parseConfig({ ...base, DATABASE_URL: 'mysql://x' })).toThrow(/DATABASE_URL/);
  });
});
