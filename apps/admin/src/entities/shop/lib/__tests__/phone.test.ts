import { describe, expect, it } from 'vitest';

import { formatPhone } from '../phone';

describe('номер WhatsApp', () => {
  it('группирует цифры 3-3-2-2 и по мере ввода', () => {
    expect(formatPhone('7000000000')).toBe('700 000 00 00');
    expect(formatPhone('70000')).toBe('700 00');
    expect(formatPhone('')).toBe('');
  });
});
