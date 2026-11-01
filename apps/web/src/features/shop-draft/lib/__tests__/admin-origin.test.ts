import { afterEach, describe, expect, it, vi } from 'vitest';

import { adminOrigin } from '../admin-origin';

describe('адрес админки для превью', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('по умолчанию — поддомен app основного домена с тем же портом', () => {
    vi.stubEnv('VITE_ADMIN_ORIGIN', '');
    vi.stubEnv('VITE_ROOT_DOMAIN', 'katalog.kz');
    expect(adminOrigin({ protocol: 'https:', port: '' })).toBe('https://app.katalog.kz');
    expect(adminOrigin({ protocol: 'http:', port: '3000' })).toBe('http://app.katalog.kz:3000');
  });

  it('VITE_ADMIN_ORIGIN задаёт адрес явно', () => {
    vi.stubEnv('VITE_ADMIN_ORIGIN', 'http://localhost:5173');
    expect(adminOrigin({ protocol: 'http:', port: '3000' })).toBe('http://localhost:5173');
  });
});
