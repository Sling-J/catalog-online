import { describe, expect, it } from 'vitest';

import { createDemoAdminProducts } from './admin-products.js';
import { DEMO_SHOP_AGE_DAYS, demoStats, emptyStats } from './admin-stats.js';

const NOW = Date.UTC(2026, 10, 8, 12);
const products = createDemoAdminProducts('http://test');

describe('статистика на моках', () => {
  it('неделя — числа из макета, последний день — сегодня', () => {
    const week = demoStats('7d', products, NOW);
    expect(week.totals).toEqual({ views: 1240, orderClicks: 46 });
    expect(week.byDay).toHaveLength(7);
    expect(week.byDay.at(-1)!.date).toBe('2026-11-08');
    expect(week.previousTotals).toEqual({ views: 1050, orderClicks: 39 });
  });

  it('30 дней и всё время: итоги — сумма по дням, у «всё время» нет прошлого периода', () => {
    const month = demoStats('30d', products, NOW);
    expect(month.byDay).toHaveLength(30);
    expect(month.totals.views).toBe(month.byDay.reduce((sum, day) => sum + day.views, 0));
    expect(month.previousTotals!.views).toBeGreaterThan(0);
    const all = demoStats('all', products, NOW);
    expect(all.byDay).toHaveLength(DEMO_SHOP_AGE_DAYS);
    expect(all.previousTotals).toBeNull();
  });

  it('«Чаще смотрят» — товары с фото, по убыванию, не больше 10', () => {
    const { topProducts } = demoStats('7d', products, NOW);
    expect(topProducts.length).toBeLessThanOrEqual(10);
    expect(topProducts.every((item) => item.cover)).toBe(true);
    expect(topProducts.map((item) => item.views)).toEqual(
      [...topProducts.map((item) => item.views)].sort((a, b) => b - a),
    );
  });

  it('новый магазин — нули', () => {
    expect(emptyStats('30d', NOW)).toMatchObject({ totals: { views: 0, orderClicks: 0 }, topProducts: [] });
    expect(emptyStats('all', NOW).previousTotals).toBeNull();
  });
});
