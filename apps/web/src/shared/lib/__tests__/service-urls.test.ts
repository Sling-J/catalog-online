import { afterEach, describe, expect, it, vi } from 'vitest';

import { serviceUrls } from '../service-urls';

describe('адреса сервиса', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('по умолчанию — поддомены основного домена с тем же протоколом и портом', () => {
    vi.stubEnv('VITE_ADMIN_ORIGIN', '');
    vi.stubEnv('VITE_DEMO_SHOP', '');
    vi.stubEnv('VITE_ROOT_DOMAIN', 'katalog.kz');
    expect(serviceUrls('https://katalog.kz')).toEqual({
      admin: 'https://app.katalog.kz',
      register: 'https://app.katalog.kz/register',
      demoShop: 'https://aigerim-kids.katalog.kz',
    });
    expect(serviceUrls('http://localhost:3000').admin).toBe('http://app.katalog.kz:3000');
  });

  it('админку и демо-магазин можно задать явно', () => {
    vi.stubEnv('VITE_ROOT_DOMAIN', 'localhost');
    vi.stubEnv('VITE_ADMIN_ORIGIN', 'http://localhost:5173');
    vi.stubEnv('VITE_DEMO_SHOP', 'demo');
    expect(serviceUrls('http://localhost:3000')).toEqual({
      admin: 'http://localhost:5173',
      register: 'http://localhost:5173/register',
      demoShop: 'http://demo.localhost:3000',
    });
  });
});
