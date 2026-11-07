import { describe, expect, it } from 'vitest';

import { closesAfterOpen, groupSchedule, normalizeTime, shopToday } from '../schedule';

const work = { open: '10:00', close: '20:00' };

describe('график магазина', () => {
  it('собирает подряд идущие дни с одинаковыми часами', () => {
    const groups = groupSchedule({
      mon: work,
      tue: work,
      wed: work,
      thu: work,
      fri: work,
      sat: { open: '11:00', close: '20:00' },
      sun: null,
    });
    expect(groups.map((group) => group.days)).toEqual([['mon', 'tue', 'wed', 'thu', 'fri'], ['sat'], ['sun']]);
    expect(groups[2]?.hours).toBeNull();
  });

  it('приводит набранное время к виду 09:30', () => {
    expect(normalizeTime('9')).toBe('09:00');
    expect(normalizeTime('930')).toBe('09:30');
    expect(normalizeTime('2130')).toBe('21:30');
    expect(normalizeTime('9.30')).toBe('09:30');
    expect(normalizeTime(' 10:00 ')).toBe('10:00');
    expect(normalizeTime('25:00')).toBe('25:00');
    expect(normalizeTime('утро')).toBe('утро');
  });

  it('закрытие позже открытия, 00:00 — конец дня', () => {
    expect(closesAfterOpen('10:00', '20:00')).toBe(true);
    expect(closesAfterOpen('10:00', '09:00')).toBe(false);
    expect(closesAfterOpen('10:00', '00:00')).toBe(true);
  });

  it('сегодня — по часовому поясу магазина', () => {
    // 2026-11-07 20:00 UTC — в Алматы (UTC+5) уже воскресенье
    expect(shopToday('Asia/Almaty', new Date('2026-11-07T20:00:00Z'))).toBe('sun');
    expect(shopToday('UTC', new Date('2026-11-07T20:00:00Z'))).toBe('sat');
  });
});
