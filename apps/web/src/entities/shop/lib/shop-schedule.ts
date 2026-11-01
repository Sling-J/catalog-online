import type { DayHours, Schedule } from '@catalog/contract';

import { WEEKDAYS } from './shop-hours';
import type { WeekdayKey } from './shop-hours.types';

export type ScheduleGroup = { days: WeekdayKey[]; hours: DayHours; isToday: boolean };

const sameHours = (a: DayHours, b: DayHours) => a === b || (!!a && !!b && a.open === b.open && a.close === b.close);

/**
 * Дни подряд с одинаковым временем сворачиваются в одну строку («Пн–Пт»);
 * сегодняшний день всегда отдельной строкой, чтобы его можно было выделить; без `today` дни не выделяются.
 */
export function groupSchedule(schedule: Schedule, today?: WeekdayKey): ScheduleGroup[] {
  const groups: ScheduleGroup[] = [];
  for (const day of WEEKDAYS) {
    const hours = schedule[day];
    const isToday = day === today;
    const last = groups.at(-1);
    if (last && !last.isToday && !isToday && sameHours(last.hours, hours)) last.days.push(day);
    else groups.push({ days: [day], hours, isToday });
  }
  return groups;
}
