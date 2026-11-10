import type { Stats } from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import { InjectDb, type Db } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { Images } from '../../core/images/index.js';
import { isBot } from './lib/bots.js';
import { daysBetween, localDate, periodRange, type StatsPeriod } from './lib/dates.js';
import { statsRepository } from './stats.repository.js';

const TOP_PRODUCTS = 10;

/** Событие витрины, уже проверенное витриной: магазин опубликован, товар (если есть) — его и виден. */
export type StorefrontEvent = { type: 'view' | 'order_click'; productId: string | null };

/**
 * Статистика витрины (FR-A10, DM4): счётчики по дням в часовом поясе магазина, без сырых событий и персональных
 * данных. Просмотр витрины — строка магазина (`productId = null`), просмотр карточки — строка товара; нажатие
 * «Заказать» — строка магазина. В итогах и по дням просмотры витрины и карточек складываются.
 */
@Injectable()
export class StatsService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly images: Images,
  ) {}

  /** Учесть событие; робота молча отбрасываем — ответ витрине тот же. Нажатие «Заказать» считается каждое. */
  async record(
    shop: { id: string; timezone: string },
    event: StorefrontEvent,
    userAgent: string,
    now = new Date(),
  ): Promise<void> {
    if (isBot(userAgent)) return;
    const date = localDate(now, shop.timezone);
    if (event.type === 'order_click') {
      await statsRepository.increment(this.db, shop.id, date, null, { views: 0, orderClicks: 1 });
    } else {
      await statsRepository.increment(this.db, shop.id, date, event.productId, { views: 1, orderClicks: 0 });
    }
  }

  async get(shopId: string, period: StatsPeriod, now = new Date()): Promise<Stats> {
    const shop = await statsRepository.shop(this.db, shopId);
    if (!shop) throw new AppError('not_found', 404);
    const today = localDate(now, shop.timezone);
    const range = periodRange(period, today, localDate(shop.createdAt, shop.timezone));
    const [totals, days, previousTotals, top] = await Promise.all([
      statsRepository.totals(this.db, shopId, range.from, range.to),
      statsRepository.byDay(this.db, shopId, range.from, range.to),
      range.previous ? statsRepository.totals(this.db, shopId, range.previous.from, range.previous.to) : null,
      statsRepository.topProducts(this.db, shopId, range.from, range.to, TOP_PRODUCTS),
    ]);
    const byDate = new Map(days.map((day) => [day.date, day]));
    return {
      period,
      totals,
      previousTotals,
      byDay: daysBetween(range.from, range.to).map((date) => ({
        date,
        views: byDate.get(date)?.views ?? 0,
        orderClicks: byDate.get(date)?.orderClicks ?? 0,
      })),
      topProducts: top.map((row) => ({
        productId: row.productId,
        name: row.name,
        views: row.views,
        cover: row.cover ? this.images.toImage(row.cover) : null,
      })),
    };
  }
}
