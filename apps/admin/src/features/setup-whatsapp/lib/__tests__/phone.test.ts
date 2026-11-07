import { describe, expect, it } from 'vitest';

import { whatsappTestLink } from '../phone';

describe('тестовое сообщение в WhatsApp', () => {
  it('ссылка wa.me с номером +7 и текстом', () => {
    expect(whatsappTestLink('7001234567', 'Привет')).toBe(
      'https://wa.me/77001234567?text=%D0%9F%D1%80%D0%B8%D0%B2%D0%B5%D1%82',
    );
  });
});
