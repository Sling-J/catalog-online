import { describe, expect, it } from 'vitest';

import { isAllowedOrigin } from './cors.js';

describe('isAllowedOrigin', () => {
  const patterns = ['http://app.localhost:3002', 'http://*.localhost:3000'];

  it('точный адрес и поддомен по шаблону', () => {
    expect(isAllowedOrigin('http://app.localhost:3002', patterns)).toBe(true);
    expect(isAllowedOrigin('http://aigerim-kids.localhost:3000', patterns)).toBe(true);
  });

  it('чужое — нет', () => {
    expect(isAllowedOrigin('http://localhost:3000', patterns)).toBe(false);
    expect(isAllowedOrigin('http://a.b.localhost:3000', patterns)).toBe(false);
    expect(isAllowedOrigin('http://evil.com/.localhost:3000', patterns)).toBe(false);
    expect(isAllowedOrigin('https://app.localhost:3002', patterns)).toBe(false);
    expect(isAllowedOrigin('http://app.localhost:3002.evil.com', patterns)).toBe(false);
  });
});
