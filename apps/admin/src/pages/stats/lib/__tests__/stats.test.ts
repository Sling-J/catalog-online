import { describe, expect, it } from 'vitest';

import { barHeight, chartBars, changePercent, peakIndex, showsLabel, showsValues, validateStatsSearch } from '../stats';

const days = (from: string, count: number) =>
  Array.from({ length: count }, (_, index) => {
    const date = new Date(Date.parse(from) + index * 86_400_000).toISOString().slice(0, 10);
    return { date, views: 10, orderClicks: 1 };
  });

describe('статистика', () => {
  it('период из адреса: неделя по умолчанию, незнакомое отбрасываем', () => {
    expect(validateStatsSearch({ period: '30d' })).toEqual({ period: '30d' });
    expect(validateStatsSearch({ period: '7d' })).toEqual({});
    expect(validateStatsSearch({ period: 'year' })).toEqual({});
  });

  it('изменение к прошлому периоду', () => {
    expect(changePercent(1240, 1050)).toBe(18);
    expect(changePercent(90, 100)).toBe(-10);
    expect(changePercent(5, 0)).toBeNull();
    expect(changePercent(5, undefined)).toBeNull();
  });

  it('до 31 дня — по дням, больше — по месяцам (последние 12)', () => {
    expect(chartBars(days('2026-11-02', 7))).toHaveLength(7);
    const months = chartBars(days('2026-06-12', 150));
    expect(months.map((bar) => bar.date)).toEqual([
      '2026-06-01',
      '2026-07-01',
      '2026-08-01',
      '2026-09-01',
      '2026-10-01',
      '2026-11-01',
    ]);
    expect(months[0]).toMatchObject({ unit: 'month', views: 190, orderClicks: 19 });
  });

  it('высота столбика и подписи', () => {
    expect(barHeight(92, 92, 92)).toBe(92);
    expect(barHeight(1, 1000, 92)).toBe(4);
    expect(barHeight(0, 10, 92)).toBe(0);
    expect(showsLabel(3, 7)).toBe(true);
    expect([...Array(30).keys()].filter((index) => showsLabel(index, 30))).toEqual([0, 5, 10, 15, 20, 25, 29]);
  });

  it('выбранный по умолчанию — самый высокий, из равных — последний; числа — только на неделе', () => {
    const bars = [5, 9, 3, 9].map((views, index) => ({
      date: String(index),
      unit: 'day' as const,
      views,
      orderClicks: 0,
    }));
    expect(peakIndex(bars)).toBe(3);
    expect(peakIndex([])).toBe(-1);
    expect(showsValues(7)).toBe(true);
    expect(showsValues(30)).toBe(false);
  });
});
