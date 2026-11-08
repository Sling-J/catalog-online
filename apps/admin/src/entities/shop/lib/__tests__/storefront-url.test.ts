import { afterEach, describe, expect, it, vi } from 'vitest';

import { storefrontHost, storefrontUrl, withPreview } from '../storefront-url';

afterEach(() => vi.unstubAllEnvs());

describe('storefrontUrl', () => {
  it('собирает поддомен на основном домене с портом витрины', () => {
    vi.stubEnv('VITE_ROOT_DOMAIN', 'catalog.kz');
    vi.stubEnv('VITE_STOREFRONT_PORT', '');
    expect(storefrontUrl('aigerim-kids', 'https://app.catalog.kz')).toBe('https://aigerim-kids.catalog.kz');
  });

  it('в разработке ведёт на порт витрины', () => {
    vi.stubEnv('VITE_STOREFRONT_PORT', '3000');
    expect(storefrontUrl('aigerim-kids', 'http://app.localhost:3002')).toBe('http://aigerim-kids.localhost:3000');
  });

  it('показывает адрес без протокола и порта', () => {
    expect(storefrontHost('http://aigerim-kids.localhost:3000')).toBe('aigerim-kids.localhost');
  });

  it('превью черновика — токен в параметре, к уже заданным параметрам через &', () => {
    expect(withPreview('http://a.localhost:3000/kurtka-1', 't/1')).toBe(
      'http://a.localhost:3000/kurtka-1?preview=t%2F1',
    );
    expect(withPreview('http://a.localhost:3000/?q=1', 't')).toBe('http://a.localhost:3000/?q=1&preview=t');
  });
});
