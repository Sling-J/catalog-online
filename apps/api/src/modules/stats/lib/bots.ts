/**
 * Поисковые и прочие роботы, превью ссылок в мессенджерах, скрипты и безголовые браузеры. Повторы просмотров
 * отсекает сама витрина (раз в сутки на покупателя, `localStorage`), API — только ботов и частоту с IP (решение
 * основателя 2026-11-10).
 */
const BOT =
  /bot\b|bot\/|crawl|spider|slurp|scrap|preview|facebookexternalhit|whatsapp|telegram|headless|lighthouse|pingdom|monitor|curl|wget|python|java\/|okhttp|go-http|axios|node-fetch|undici|httpclient|libwww|postman|insomnia/i;

/** Похоже на робота: пустой User-Agent или известная подпись. */
export function isBot(userAgent: string): boolean {
  const ua = userAgent.trim();
  return ua === '' || BOT.test(ua);
}
