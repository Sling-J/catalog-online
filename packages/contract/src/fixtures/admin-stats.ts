// Статистика админки на моках (T-313): неизменные примеры за 7 и 30 дней и за всё время (магазин «открыт» 150 дней
// назад). Неделя — те же числа, что в макете AdminPhone2 «Статистика» (1 240 просмотров, 46 нажатий); остальное
// выдумано, но повторяется от запуска к запуску. «Чаще смотрят» — товары демо-магазина с фото. У нового магазина нули.
import type { Product, Stats } from '../gen/types.gen.js';

export type StatsPeriod = Stats['period'];

const DAY_MS = 86_400_000;
// пропорционально столбикам макета (38, 52, 44, 70, 61, 92, 80), в сумме 1 240
const WEEK_VIEWS = [108, 148, 125, 198, 173, 261, 227];
const WEEK_CLICKS = [5, 6, 7, 5, 8, 9, 6];
/** Сколько дней «работает» демо-магазин — длина периода «всё время». */
export const DEMO_SHOP_AGE_DAYS = 150;
const TOP_VIEWS = [214, 168, 121, 96, 80, 64, 51, 40, 33, 25];

/** Последние `count` дней по UTC, от старых к новым; последний — сегодня. */
export const lastDays = (count: number, now = Date.now()): string[] =>
  Array.from({ length: count }, (_, index) => new Date(now - (count - 1 - index) * DAY_MS).toISOString().slice(0, 10));

const sum = (list: { views: number; orderClicks: number }[]) => ({
  views: list.reduce((total, day) => total + day.views, 0),
  orderClicks: list.reduce((total, day) => total + day.orderClicks, 0),
});

// день номер `index` от открытия: рост со временем, выходные чуть выше, без случайности
const viewsOn = (index: number) => Math.round(40 + index * 0.9 + ((index * 37) % 23) + (index % 7 >= 5 ? 25 : 0));
const clicksOn = (index: number) => Math.max(0, Math.round(viewsOn(index) / 26) - (index % 3));

const daysOf = (period: StatsPeriod): number => (period === '7d' ? 7 : period === '30d' ? 30 : DEMO_SHOP_AGE_DAYS);

export const demoStats = (period: StatsPeriod, products: Product[], now = Date.now()): Stats => {
  const count = daysOf(period);
  const dates = lastDays(count, now);
  const byDay =
    period === '7d'
      ? dates.map((date, index) => ({ date, views: WEEK_VIEWS[index]!, orderClicks: WEEK_CLICKS[index]! }))
      : dates.map((date, index) => {
          const day = DEMO_SHOP_AGE_DAYS - count + index;
          return { date, views: viewsOn(day), orderClicks: clicksOn(day) };
        });
  const previousTotals =
    period === '7d'
      ? { views: 1050, orderClicks: 39 }
      : period === '30d'
        ? sum(
            Array.from({ length: 30 }, (_, index) => DEMO_SHOP_AGE_DAYS - 60 + index).map((day) => ({
              views: viewsOn(day),
              orderClicks: clicksOn(day),
            })),
          )
        : null;
  const scale = period === '7d' ? 1 : period === '30d' ? 4 : 16;
  const topProducts = products
    .filter((product) => product.photos[0]?.image)
    .slice(0, TOP_VIEWS.length)
    .map((product, index) => ({
      productId: product.id,
      name: product.name,
      views: TOP_VIEWS[index]! * scale,
      cover: product.photos[0]!.image,
    }));
  return { period, totals: sum(byDay), previousTotals, byDay, topProducts };
};

export const emptyStats = (period: StatsPeriod, now = Date.now()): Stats => ({
  period,
  totals: { views: 0, orderClicks: 0 },
  previousTotals: period === 'all' ? null : { views: 0, orderClicks: 0 },
  // новый магазин открыт сегодня: за всё время — один день
  byDay: lastDays(period === '7d' ? 7 : period === '30d' ? 30 : 1, now).map((date) => ({
    date,
    views: 0,
    orderClicks: 0,
  })),
  topProducts: [],
});
