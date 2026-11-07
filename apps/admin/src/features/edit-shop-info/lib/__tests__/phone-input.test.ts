import { describe, expect, it } from 'vitest';

import { phoneDigits, phoneText } from '../phone-input';

describe('поле WhatsApp', () => {
  it('показывает номер с +7 и группами', () => {
    expect(phoneText('7000000000')).toBe('+7 700 000 00 00');
    expect(phoneText('')).toBe('');
  });

  it('оставляет 10 цифр после кода страны', () => {
    expect(phoneDigits('+7 700 000 00 001')).toBe('7000000000');
    expect(phoneDigits('+7 70')).toBe('70');
    expect(phoneDigits('87001234567')).toBe('7001234567');
    expect(phoneDigits('7001234567')).toBe('7001234567');
    expect(phoneDigits('7')).toBe('7');
  });
});
