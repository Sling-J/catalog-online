import type { Schedule } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import { getInitials } from '../shop-initials';
import { groupSchedule } from '../shop-schedule';

const weekday = { open: '10:00', close: '20:00' };
const schedule: Schedule = {
  mon: weekday,
  tue: weekday,
  wed: weekday,
  thu: weekday,
  fri: weekday,
  sat: { open: '11:00', close: '20:00' },
  sun: { open: '11:00', close: '18:00' },
};

describe('groupSchedule', () => {
  it('сворачивает будни, сегодняшний день отдельно', () => {
    expect(groupSchedule(schedule, 'sat')).toEqual([
      { days: ['mon', 'tue', 'wed', 'thu', 'fri'], hours: weekday, isToday: false },
      { days: ['sat'], hours: schedule.sat, isToday: true },
      { days: ['sun'], hours: schedule.sun, isToday: false },
    ]);
  });

  it('сегодня в середине будней делит их на две строки', () => {
    const groups = groupSchedule(schedule, 'wed');
    expect(groups.map((g) => g.days)).toEqual([['mon', 'tue'], ['wed'], ['thu', 'fri'], ['sat'], ['sun']]);
  });

  it('выходные подряд сворачиваются', () => {
    const groups = groupSchedule({ ...schedule, sat: null, sun: null }, 'mon');
    expect(groups.at(-1)).toEqual({ days: ['sat', 'sun'], hours: null, isToday: false });
  });
});

describe('getInitials', () => {
  it('две первые буквы заглавными', () => {
    expect(getInitials('Айгерим Kids')).toBe('АK');
    expect(getInitials('  магазин  ')).toBe('М');
    expect(getInitials('')).toBe('');
  });
});
