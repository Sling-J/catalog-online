import type { Schedule } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import { getOpenStatus, getShopLocalTime } from '../shop-hours';

const schedule: Schedule = {
  mon: { open: '10:00', close: '20:00' },
  tue: { open: '10:00', close: '20:00' },
  wed: { open: '10:00', close: '20:00' },
  thu: { open: '10:00', close: '20:00' },
  fri: { open: '10:00', close: '20:00' },
  sat: { open: '11:00', close: '20:00' },
  sun: null,
};
const tz = 'Asia/Almaty'; // UTC+5

// 2026-11-02 — понедельник; время задаём в UTC, магазин на 5 часов впереди
const at = (iso: string) => new Date(`${iso}Z`);

describe('getShopLocalTime', () => {
  it('переводит в часовой пояс магазина', () => {
    expect(getShopLocalTime(tz, at('2026-11-02T06:30:00'))).toEqual({ day: 'mon', minutes: 11 * 60 + 30 });
  });

  it('переходит на следующий день по времени магазина', () => {
    expect(getShopLocalTime(tz, at('2026-11-02T20:00:00'))).toEqual({ day: 'tue', minutes: 60 });
  });
});

describe('getOpenStatus', () => {
  it('открыт в рабочие часы', () => {
    expect(getOpenStatus(schedule, tz, at('2026-11-02T06:30:00'))).toEqual({ kind: 'open', closesAt: '20:00' });
  });

  it('до открытия — откроется сегодня', () => {
    expect(getOpenStatus(schedule, tz, at('2026-11-02T03:00:00'))).toEqual({
      kind: 'closed',
      next: { day: 'mon', daysAhead: 0, time: '10:00' },
    });
  });

  it('в момент закрытия уже закрыт', () => {
    expect(getOpenStatus(schedule, tz, at('2026-11-02T15:00:00'))).toEqual({
      kind: 'closed',
      next: { day: 'tue', daysAhead: 1, time: '10:00' },
    });
  });

  it('пропускает выходной', () => {
    // суббота 21:00 по магазину → воскресенье выходной → понедельник
    expect(getOpenStatus(schedule, tz, at('2026-11-07T16:00:00'))).toEqual({
      kind: 'closed',
      next: { day: 'mon', daysAhead: 2, time: '10:00' },
    });
  });

  it('закрытие в 00:00 — конец дня', () => {
    const late: Schedule = { ...schedule, mon: { open: '10:00', close: '00:00' } };
    expect(getOpenStatus(late, tz, at('2026-11-02T18:30:00'))).toEqual({ kind: 'open', closesAt: '00:00' });
  });

  it('все дни выходные — открытия нет', () => {
    const none: Schedule = { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };
    expect(getOpenStatus(none, tz, at('2026-11-02T06:30:00'))).toEqual({ kind: 'closed', next: null });
  });
});
