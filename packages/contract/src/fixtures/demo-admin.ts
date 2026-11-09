// Владелец и настройки демо-магазина «Айгерим Kids»: общие для моков админки (admin-handlers.ts) и сида базы API
// (apps/api, T-402). Без импорта msw — файл читает API.

export const DEMO_SHOP_ID = '0192d000-0000-7000-8000-00000000a001';
export const DEMO_ACCOUNT_ID = '0192d000-0000-7000-8000-00000000b001';
export const DEMO_ADMIN_EMAIL = 'aigerim.kids@example.com';
/** Пароль демо-владельца — для входа на моках и в демо-магазин из сида API. */
export const DEMO_ADMIN_PASSWORD = 'demo-password';

/** Настройки наличия и дата публикации демо-магазина (остальное — `demoShop` в demo-shop.ts). */
export const demoShopSettings = {
  lowStockThreshold: 2,
  showOutOfStock: true,
  publishedAt: '2026-10-20T09:00:00Z',
} as const;
