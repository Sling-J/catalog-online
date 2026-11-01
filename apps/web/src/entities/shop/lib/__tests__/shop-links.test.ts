import { describe, expect, it } from 'vitest';

import { formatPhone, instagramLink, twoGisLink, whatsappLink } from '../shop-links';

describe('shop links', () => {
  it('whatsapp: только цифры, текст кодируется', () => {
    expect(whatsappLink('+77000000000')).toBe('https://wa.me/77000000000');
    expect(whatsappLink('+77000000000', 'a b')).toBe('https://wa.me/77000000000?text=a%20b');
  });

  it('2ГИС: адрес кодируется', () => {
    expect(twoGisLink('a b')).toBe('https://2gis.kz/search/a%20b');
  });

  it('instagram: убирает @', () => {
    expect(instagramLink('@aigerim.kids')).toBe('https://instagram.com/aigerim.kids');
  });

  it('телефон: форматирует казахстанский номер, остальное не трогает', () => {
    expect(formatPhone('+77000000000')).toBe('+7 700 000 00 00');
    expect(formatPhone('+441234')).toBe('+441234');
  });
});
