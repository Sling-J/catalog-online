import { describe, expect, it } from 'vitest';

import { formatPrice } from '../format-price';

describe('formatPrice', () => {
  it('разделяет разряды и добавляет тенге неразрывными пробелами', () => {
    expect(formatPrice(18900)).toBe('18 900 ₸');
    expect(formatPrice(1250000)).toBe('1 250 000 ₸');
  });

  it('мелкие суммы без разделителя', () => {
    expect(formatPrice(0)).toBe('0 ₸');
    expect(formatPrice(990)).toBe('990 ₸');
  });
});
