import { describe, expect, it } from 'vitest';

import { whatsappShareUrl } from '../share';

describe('ссылка «Отправить в WhatsApp»', () => {
  it('адрес витрины — в тексте сообщения', () => {
    expect(whatsappShareUrl('https://aigerim-kids.example.kz')).toBe(
      'https://wa.me/?text=https%3A%2F%2Faigerim-kids.example.kz',
    );
  });
});
