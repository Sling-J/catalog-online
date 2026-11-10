import { describe, expect, it } from 'vitest';

import { isBot } from './bots.js';
import { addDays, daysBetween, localDate, periodRange } from './dates.js';

describe('даты статистики', () => {
  it('дата — по часовому поясу магазина', () => {
    const at = new Date('2026-11-09T20:30:00Z');
    expect(localDate(at, 'Asia/Almaty')).toBe('2026-11-10');
    expect(localDate(at, 'UTC')).toBe('2026-11-09');
  });

  it('сдвиг и перечень дней через границы месяцев и года', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-02-27', '2026-03-02')).toEqual(['2026-02-27', '2026-02-28', '2026-03-01', '2026-03-02']);
    expect(daysBetween('2026-03-02', '2026-03-01')).toEqual([]);
  });

  it('периоды: последние 7 / 30 дней с сегодняшним и столько же до них; всё время — с регистрации', () => {
    expect(periodRange('7d', '2026-11-10', '2026-01-01')).toEqual({
      from: '2026-11-04',
      to: '2026-11-10',
      previous: { from: '2026-10-28', to: '2026-11-03' },
    });
    expect(periodRange('30d', '2026-11-10', '2026-01-01')).toEqual({
      from: '2026-10-12',
      to: '2026-11-10',
      previous: { from: '2026-09-12', to: '2026-10-11' },
    });
    expect(periodRange('all', '2026-11-10', '2026-11-01')).toEqual({
      from: '2026-11-01',
      to: '2026-11-10',
      previous: null,
    });
    expect(periodRange('all', '2026-11-10', '2026-11-10').from).toBe('2026-11-10');
  });
});

describe('роботы', () => {
  it('пустой User-Agent, поисковики, превью мессенджеров и скрипты — роботы; браузеры — нет', () => {
    for (const ua of [
      '',
      '  ',
      'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
      'Mozilla/5.0 (compatible; YandexBot/3.0)',
      'facebookexternalhit/1.1',
      'WhatsApp/2.23.20.0 A',
      'TelegramBot (like TwitterBot)',
      'Mozilla/5.0 HeadlessChrome/120.0',
      'curl/8.4.0',
      'python-requests/2.31',
      'node-fetch/1.0',
    ]) {
      expect(isBot(ua), ua).toBe(true);
    }
    for (const ua of [
      'Mozilla/5.0 (iPhone; CPU iPhone OS 17_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Mobile/15E148 Safari/604.1',
      'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Mobile Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    ]) {
      expect(isBot(ua), ua).toBe(false);
    }
  });
});
