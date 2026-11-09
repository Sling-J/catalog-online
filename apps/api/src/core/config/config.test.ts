import { describe, expect, it } from 'vitest';

import { parseConfig } from './config.js';

const base = {
  DATABASE_URL: 'postgres://catalog:catalog@localhost:5432/catalog',
  CORS_ORIGINS: 'http://app.localhost:3002, http://*.localhost:3000',
};

describe('parseConfig', () => {
  it('умолчания и разбор списка адресов', () => {
    expect(parseConfig(base)).toEqual({
      env: 'development',
      port: 3001,
      databaseUrl: base.DATABASE_URL,
      corsOrigins: ['http://app.localhost:3002', 'http://*.localhost:3000'],
      logLevel: 'info',
      trustProxy: 0,
    });
  });

  it('строки окружения приводятся к числам', () => {
    expect(parseConfig({ ...base, API_PORT: '4000', TRUST_PROXY: '1' })).toMatchObject({ port: 4000, trustProxy: 1 });
  });

  it('нет обязательных переменных — понятная ошибка со списком', () => {
    expect(() => parseConfig({})).toThrow(/DATABASE_URL[\s\S]*CORS_ORIGINS/);
    expect(() => parseConfig({ ...base, DATABASE_URL: 'mysql://x' })).toThrow(/DATABASE_URL/);
  });
});
