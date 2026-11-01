import { describe, expect, it } from 'vitest';

import { parseProductPath, productPath } from '../product-path';

describe('productPath / parseProductPath', () => {
  it('собирает и разбирает адрес', () => {
    expect(productPath({ slug: 'kurtka-zimnyaya', shortId: 'ab12c' })).toBe('kurtka-zimnyaya-ab12c');
    expect(parseProductPath('kurtka-zimnyaya-ab12c')).toEqual({ slug: 'kurtka-zimnyaya', shortId: 'ab12c' });
    expect(parseProductPath('shapka-x9k2m4')).toEqual({ slug: 'shapka', shortId: 'x9k2m4' });
  });

  it('чужие адреса не разбираются', () => {
    expect(parseProductPath('robots.txt')).toBeNull();
    expect(parseProductPath('favicon.ico')).toBeNull();
    expect(parseProductPath('kurtka')).toBeNull();
    expect(parseProductPath('kurtka-ab1')).toBeNull();
    expect(parseProductPath('kurtka-ABCDE')).toBeNull();
  });
});
