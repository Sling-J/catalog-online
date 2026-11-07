import type { DayHours, Schedule } from '@catalog/contract';

export type WeekdayKey = keyof Schedule;

/** Дни недели в порядке показа (с понедельника). */
export const WEEKDAYS: readonly WeekdayKey[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const SHORT_DAY_TO_KEY: Record<string, WeekdayKey> = {
  Mon: 'mon',
  Tue: 'tue',
  Wed: 'wed',
  Thu: 'thu',
  Fri: 'fri',
  Sat: 'sat',
  Sun: 'sun',
};

/** Сегодняшний день недели по часовому поясу магазина (его выделяем в графике, как «сегодня» на витрине). */
export function shopToday(timezone: string, now: Date = new Date()): WeekdayKey {
  const weekday = new Intl.DateTimeFormat('en-US', { timeZone: timezone, weekday: 'short' }).format(now);
  return SHORT_DAY_TO_KEY[weekday] ?? 'mon';
}

/** Подряд идущие дни с одинаковыми часами: «Пн–Пт 10:00–20:00» в кратком графике. */
export type ScheduleGroup = { days: WeekdayKey[]; hours: DayHours };

const sameHours = (a: DayHours, b: DayHours): boolean => a?.open === b?.open && a?.close === b?.close;

export function groupSchedule(schedule: Schedule): ScheduleGroup[] {
  const groups: ScheduleGroup[] = [];
  for (const day of WEEKDAYS) {
    const hours = schedule[day];
    const last = groups.at(-1);
    if (last && sameHours(last.hours, hours)) last.days.push(day);
    else groups.push({ days: [day], hours });
  }
  return groups;
}

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

/** Время в формате контракта: «09:30». */
export const isTime = (value: string): boolean => TIME.test(value);

/**
 * Время, набранное как удобно, — к виду «09:30»: «9» → «09:00», «930» → «09:30», «9.30» и «9 30» → «09:30».
 * Непонятное возвращаем как есть — его подсветит проверка.
 */
export function normalizeTime(input: string): string {
  const value = input.trim();
  const parts = value.split(/[:.,\s-]+/).filter(Boolean);
  let hours: string | undefined;
  let minutes: string | undefined;
  if (parts.length === 2) [hours, minutes] = parts;
  else if (parts.length === 1 && /^\d{1,4}$/.test(value)) {
    hours = value.length <= 2 ? value : value.slice(0, value.length - 2);
    minutes = value.length <= 2 ? '00' : value.slice(-2);
  }
  if (hours === undefined || minutes === undefined || !/^\d{1,2}$/.test(hours) || !/^\d{2}$/.test(minutes)) {
    return value;
  }
  const time = `${hours.padStart(2, '0')}:${minutes}`;
  return isTime(time) ? time : value;
}

const toMinutes = (time: string): number => {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

/** Закрытие позже открытия; «00:00» — до конца дня (так считает витрина). */
export const closesAfterOpen = (open: string, close: string): boolean =>
  (toMinutes(close) || 24 * 60) > toMinutes(open);
