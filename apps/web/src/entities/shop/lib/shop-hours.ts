import type { Schedule } from '@catalog/contract';

import type { OpenState, WeekdayKey } from './shop-hours.types';

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

function toMinutes(time: string): number {
  const [hours = 0, minutes = 0] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/** День недели и минуты от полуночи в часовом поясе магазина, а не покупателя. */
export function getShopLocalTime(timezone: string, now: Date): { day: WeekdayKey; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? '';
  return {
    day: SHORT_DAY_TO_KEY[get('weekday')] ?? 'mon',
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

/** Открыт ли магазин сейчас, а если нет — когда откроется. Закрытие «00:00» считается концом дня. */
export function getOpenStatus(schedule: Schedule, timezone: string, now: Date): OpenState {
  const { day, minutes } = getShopLocalTime(timezone, now);
  const todayIndex = WEEKDAYS.indexOf(day);
  const today = schedule[day];

  if (today) {
    const close = toMinutes(today.close) || 24 * 60;
    if (minutes >= toMinutes(today.open) && minutes < close) return { kind: 'open', closesAt: today.close };
    if (minutes < toMinutes(today.open)) return { kind: 'closed', next: { day, daysAhead: 0, time: today.open } };
  }

  for (let daysAhead = 1; daysAhead <= 7; daysAhead += 1) {
    const nextDay = WEEKDAYS[(todayIndex + daysAhead) % 7]!;
    const hours = schedule[nextDay];
    if (hours) return { kind: 'closed', next: { day: nextDay, daysAhead, time: hours.open } };
  }
  return { kind: 'closed', next: null };
}
