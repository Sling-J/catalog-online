/** Даты статистики — `YYYY-MM-DD` по часовому поясу магазина (DM4). */

const DAY_MS = 86_400_000;

export type StatsPeriod = '7d' | '30d' | 'all';

/** Дни периода (включительно) и прошлый такой же период; у «всего времени» прошлого нет. */
export type PeriodRange = { from: string; to: string; previous: { from: string; to: string } | null };

/** Календарная дата момента в часовом поясе (`Asia/Almaty`). */
export function localDate(at: Date, timezone: string): string {
  // en-CA пишет дату как YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(at);
}

export function addDays(date: string, days: number): string {
  return new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);
}

/** Все даты от `from` до `to` включительно. */
export function daysBetween(from: string, to: string): string[] {
  const days: string[] = [];
  for (let day = from; day <= to; day = addDays(day, 1)) days.push(day);
  return days;
}

/**
 * Неделя и 30 дней — последние 7 / 30 дней с сегодняшним, прошлый период — столько же дней перед ними. «Всё
 * время» — со дня регистрации магазина (решение основателя 2026-11-10).
 */
export function periodRange(period: StatsPeriod, today: string, registered: string): PeriodRange {
  if (period === 'all') return { from: registered < today ? registered : today, to: today, previous: null };
  const length = period === '7d' ? 7 : 30;
  const from = addDays(today, -(length - 1));
  return { from, to: today, previous: { from: addDays(from, -length), to: addDays(from, -1) } };
}
