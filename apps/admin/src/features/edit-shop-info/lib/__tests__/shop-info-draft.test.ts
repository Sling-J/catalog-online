import type { Shop } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import { draftFromShop, previewFromDraft, shopInfoChanges, validateShopInfo } from '../shop-info-draft';

const work = { open: '10:00', close: '20:00' };
const shop = {
  name: 'Айгерим Kids',
  description: 'Детская одежда',
  address: 'Шымкент',
  howToFind: null,
  whatsapp: '+77000000000',
  instagram: '@aigerim.kids',
  schedule: { mon: work, tue: work, wed: work, thu: work, fri: work, sat: work, sun: null },
} as Shop;

describe('форма «О магазине»', () => {
  it('выходной помнит часы по умолчанию, номер — без +7', () => {
    const draft = draftFromShop(shop);
    expect(draft.whatsapp).toBe('7000000000');
    expect(draft.howToFind).toBe('');
    expect(draft.schedule.sun).toEqual({ on: false, open: '10:00', close: '20:00' });
  });

  it('отправляет только изменённое, пустой текст — null', () => {
    const initial = draftFromShop(shop);
    expect(shopInfoChanges(initial, initial)).toEqual({});
    const draft = {
      ...initial,
      description: '  ',
      schedule: { ...initial.schedule, sun: { on: true, open: '11:00', close: '18:00' } },
    };
    expect(shopInfoChanges(initial, draft)).toEqual({
      description: null,
      schedule: { ...shop.schedule, sun: { open: '11:00', close: '18:00' } },
    });
  });

  it('проверяет название, номер и время по дням', () => {
    const initial = draftFromShop(shop);
    expect(validateShopInfo(initial)).toEqual({ name: undefined, whatsapp: undefined, days: {} });
    const errors = validateShopInfo({
      ...initial,
      name: ' ',
      whatsapp: '700',
      schedule: {
        ...initial.schedule,
        mon: { on: true, open: '10', close: '20:00' },
        tue: { on: true, open: '20:00', close: '10:00' },
        sun: { on: false, open: 'x', close: 'y' },
      },
    });
    expect(errors).toEqual({ name: 'name', whatsapp: 'whatsapp', days: { mon: 'time', tue: 'order' } });
  });

  it('в превью не уходят пустое название, неполный номер и непонятное время', () => {
    const initial = draftFromShop(shop);
    const preview = previewFromDraft({
      ...initial,
      name: '',
      whatsapp: '700',
      schedule: { ...initial.schedule, mon: { on: true, open: 'утро', close: '20:00' } },
    });
    expect(preview).not.toHaveProperty('name');
    expect(preview).not.toHaveProperty('whatsapp');
    expect(preview.schedule?.mon).toBeNull();
    expect(preview.instagram).toBe('@aigerim.kids');
  });
});
