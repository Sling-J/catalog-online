import { describe, expect, it } from 'vitest';

import { isStrongPassword, looksLikeEmail } from '../credentials';

describe('почта и пароль', () => {
  it('надёжный пароль — от 8 символов и два вида знаков', () => {
    expect(isStrongPassword('abc12')).toBe(false);
    expect(isStrongPassword('abcdefgh')).toBe(false);
    expect(isStrongPassword('пароль2026')).toBe(true);
    expect(isStrongPassword('12345678!')).toBe(true);
  });

  it('почта: нужен @ и точка в домене', () => {
    expect(looksLikeEmail(' aigerim.kids@mail.kz ')).toBe(true);
    expect(looksLikeEmail('aigerim.kids@mail')).toBe(false);
    expect(looksLikeEmail('aigerim kids@mail.kz')).toBe(false);
  });
});
