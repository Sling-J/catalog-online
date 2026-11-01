import { describe, expect, it } from 'vitest';

import type { CartItem } from '@/entities/cart';

import { buildOrderText } from '../build-order-text';

const item = (overrides: Partial<CartItem> = {}): CartItem => ({
  variantId: 'v1',
  quantity: 1,
  productShortId: 'abcde',
  slug: 'kurtka',
  name: 'Куртка зимняя',
  variantLabel: 'Размер: 110, Цвет: синий',
  price: 25000,
  photo: null,
  maxQuantity: null,
  ...overrides,
});

const labels = {
  greeting: 'Здравствуйте! Заказ с сайта Айгерим Kids:',
  totalLabel: 'Итого',
  commentLabel: 'Комментарий',
};

describe('buildOrderText', () => {
  it('собирает заявку как в FR-V8: позиции с ценой за штуку и итог', () => {
    const text = buildOrderText({
      ...labels,
      items: [item(), item({ variantId: 'v2', name: 'Шапка', variantLabel: 'Размер: 52', quantity: 2, price: 7000 })],
      total: 39000,
      comment: '',
    });
    expect(text).toBe(
      [
        'Здравствуйте! Заказ с сайта Айгерим Kids:',
        '1. Куртка зимняя (Размер: 110, Цвет: синий) × 1 — 25 000 ₸',
        '2. Шапка (Размер: 52) × 2 — 7 000 ₸',
        'Итого: 39 000 ₸',
      ].join('\n'),
    );
  });

  it('без неразрывных пробелов в ценах', () => {
    const text = buildOrderText({ ...labels, items: [item()], total: 25000, comment: '' });
    expect(text).not.toContain(' ');
  });

  it('товар без свойств — без скобок', () => {
    const text = buildOrderText({ ...labels, items: [item({ variantLabel: '' })], total: 25000, comment: '' });
    expect(text).toContain('1. Куртка зимняя × 1 — 25 000 ₸');
  });

  it('комментарий добавляется в конце, пустой и из пробелов — нет', () => {
    const withNote = buildOrderText({ ...labels, items: [item()], total: 25000, comment: '  Позвоните заранее ' });
    expect(withNote.endsWith('Комментарий: Позвоните заранее')).toBe(true);
    const blank = buildOrderText({ ...labels, items: [item()], total: 25000, comment: '   ' });
    expect(blank).not.toContain('Комментарий');
  });
});
