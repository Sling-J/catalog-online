import type { Schedule } from '@catalog/contract';

export type WeekdayKey = keyof Schedule;

/** Ближайшее открытие: через сколько дней (0 — сегодня позже) и во сколько. */
export type NextOpening = { day: WeekdayKey; daysAhead: number; time: string };

export type OpenState = { kind: 'open'; closesAt: string } | { kind: 'closed'; next: NextOpening | null };
