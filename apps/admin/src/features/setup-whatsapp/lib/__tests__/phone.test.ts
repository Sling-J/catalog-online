import { describe, expect, it } from 'vitest';

import { formatPhone, whatsappTestLink } from '../phone';

describe('номер WhatsApp', () => {
  it('группирует цифры 3-3-2-2 и по мере ввода', () => {
    expect(formatPhone('7000000000')).toBe('700 000 00 00');
    expect(formatPhone('70000')).toBe('700 00');
    expect(formatPhone('')).toBe('');
  });

  it('ссылка wa.me с номером +7 и текстом', () => {
    expect(whatsappTestLink('7001234567', 'Привет')).toBe(
      'https://wa.me/77001234567?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82',
    );
  });
});
