import type { Stats } from '@catalog/contract';

export type StatsPeriod = Stats['period'];

const PERIODS: StatsPeriod[] = ['7d', '30d', 'all'];

/** Период в адресе: `?period=30d`; неделя — по умолчанию и в адрес не пишется. */
export type StatsSearch = { period?: Exclude<StatsPeriod, '7d'> };

export function validateStatsSearch(raw: Record<string, unknown>): StatsSearch {
  return raw.period === '30d' || raw.period === 'all' ? { period: raw.period } : {};
}

export const periodOf = (search: StatsSearch): StatsPeriod => search.period ?? '7d';
export const isPeriod = (value: string): value is StatsPeriod => PERIODS.includes(value as StatsPeriod);

/** Изменение к прошлому периоду в процентах, целым; `null` — сравнивать не с чем (всё время, раньше было 0). */
export function changePercent(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Столбик графика «Просмотры по дням»: день (до 31 дня) или месяц (за всё время, если дней больше — иначе
 * столбики станут нитками). `date` — день `YYYY-MM-DD` или первое число месяца.
 */
export type ChartBar = { date: string; unit: 'day' | 'month'; views: number; orderClicks: number };

const MAX_DAY_BARS = 31;
const MAX_MONTH_BARS = 12;

export function chartBars(byDay: Stats['byDay']): ChartBar[] {
  if (byDay.length <= MAX_DAY_BARS)
    return byDay.map((day) => ({ date: day.date, unit: 'day', views: day.views, orderClicks: day.orderClicks }));
  const months = new Map<string, { views: number; orderClicks: number }>();
  for (const day of byDay) {
    const month = `${day.date.slice(0, 7)}-01`;
    const total = months.get(month) ?? { views: 0, orderClicks: 0 };
    months.set(month, { views: total.views + day.views, orderClicks: total.orderClicks + day.orderClicks });
  }
  return [...months]
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-MAX_MONTH_BARS)
    .map(([date, total]) => ({ date, unit: 'month', ...total }));
}

/** Высота столбика в px: самый большой — во всю высоту, ненулевой — не ниже 4 px, чтобы его было видно. */
export function barHeight(views: number, max: number, full: number): number {
  if (views <= 0 || max <= 0) return 0;
  return Math.max(4, Math.round((views / max) * full));
}

/** Числа над столбиками — только когда их не больше 7 (неделя): иначе не помещаются. */
export const showsValues = (count: number): boolean => count <= 7;

/** Выбранный по умолчанию столбик — самый высокий (последний из равных — ближе к сегодня). */
export function peakIndex(bars: ChartBar[]): number {
  let peak = -1;
  bars.forEach((bar, index) => {
    if (peak < 0 || bar.views >= bars[peak]!.views) peak = index;
  });
  return peak;
}

/** Подписи под графиком: под каждым столбиком, если их до 12; иначе — каждая пятая и последняя. */
export const showsLabel = (index: number, count: number): boolean =>
  count <= MAX_MONTH_BARS || index % 5 === 0 || index === count - 1;
