import { describe, expect, it } from 'vitest';

import { computeReadiness } from './readiness.js';
import { prepareShopPatch, scheduleErrors } from './shop-update.js';
import { subdomainProblem } from './subdomain.js';

const closed = { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };

describe('subdomainProblem', () => {
  it('формат как в контракте', () => {
    expect(subdomainProblem('aigerim-kids')).toBeNull();
    expect(subdomainProblem('ab')).toBe('invalid');
    expect(subdomainProblem('-shop')).toBe('invalid');
    expect(subdomainProblem('shop-')).toBe('invalid');
    expect(subdomainProblem('Shop')).toBe('invalid');
    expect(subdomainProblem('a'.repeat(31))).toBe('invalid');
  });

  it('служебные слова', () => {
    for (const word of ['www', 'api', 'admin', 'login', 'demo', 'staging'])
      expect(subdomainProblem(word)).toBe('reserved');
  });
});

describe('scheduleErrors', () => {
  it('закрытие позже открытия; 00:00 — до конца дня', () => {
    expect(
      scheduleErrors({
        ...closed,
        mon: { open: '10:00', close: '20:00' },
        tue: { open: '10:00', close: '09:00' },
        wed: { open: '10:00', close: '10:00' },
        thu: { open: '18:00', close: '00:00' },
      }),
    ).toEqual([
      { field: 'schedule.tue.close', code: 'out_of_range' },
      { field: 'schedule.wed.close', code: 'out_of_range' },
    ]);
  });
});

describe('prepareShopPatch', () => {
  it('только переданные поля; пробелы убраны, пустой необязательный текст — null', () => {
    expect(prepareShopPatch({ name: '  Айгерим Kids ', description: '   ', instagram: ' @shop ' })).toEqual({
      patch: { name: 'Айгерим Kids', description: null, instagram: '@shop' },
      errors: [],
    });
    expect(prepareShopPatch({}).patch).toEqual({});
  });

  it('название из пробелов — required', () => {
    expect(prepareShopPatch({ name: '   ' }).errors).toEqual([{ field: 'name', code: 'required' }]);
  });
});

describe('computeReadiness', () => {
  const filled = { name: 'Магазин', subdomain: 'magazin', whatsapp: '+77000000000', address: null, schedule: closed };

  it('публиковать можно с названием, адресом, WhatsApp и видимым товаром', () => {
    expect(computeReadiness(filled, { total: 2, visible: 1, withoutPhoto: 2 })).toEqual({
      settingsFilled: false,
      productCount: 2,
      productsWithoutPhoto: 2,
      canPublish: true,
    });
    expect(computeReadiness(filled, { total: 2, visible: 0, withoutPhoto: 0 }).canPublish).toBe(false);
    expect(computeReadiness({ ...filled, whatsapp: null }, { total: 1, visible: 1, withoutPhoto: 0 }).canPublish).toBe(
      false,
    );
  });

  it('«Расскажите о магазине» — адрес и хотя бы один рабочий день', () => {
    const counts = { total: 0, visible: 0, withoutPhoto: 0 };
    expect(computeReadiness({ ...filled, address: 'ТЦ Мега' }, counts).settingsFilled).toBe(false);
    const schedule = { ...closed, sat: { open: '10:00', close: '18:00' } };
    expect(computeReadiness({ ...filled, address: 'ТЦ Мега', schedule }, counts).settingsFilled).toBe(true);
  });
});
