import type { Shop } from '@catalog/contract';

export type ChecklistKey = 'settings' | 'products' | 'photos' | 'email' | 'publish';

export type ChecklistItem = {
  key: ChecklistKey;
  done: boolean;
  /** Пункт пока не к чему применить (фото, когда товаров нет) — подпись серая, без действия. */
  muted?: boolean;
};

/** Что мешает опубликовать: товаров нет (сначала это), почта не подтверждена (A9) — или ничего. */
export type PublishBlocker = 'products' | 'email' | null;

/**
 * Чек-лист главной до публикации (FR-A2, макеты AdminPhone экран 1, AdminAuthPhone экран 10, AdminHome).
 * Пункт почты — только пока она не подтверждена; публикация — всегда последний и всегда не сделан.
 */
export function buildChecklist(readiness: Shop['readiness'], emailVerified: boolean) {
  const { settingsFilled, productCount, productsWithoutPhoto } = readiness;
  const items: ChecklistItem[] = [
    { key: 'settings', done: settingsFilled },
    { key: 'products', done: productCount > 0 },
    productCount === 0
      ? { key: 'photos', done: false, muted: true }
      : { key: 'photos', done: productsWithoutPhoto === 0 },
    ...(emailVerified ? [] : [{ key: 'email' as const, done: false }]),
    { key: 'publish', done: false },
  ];
  const blocker: PublishBlocker = productCount === 0 ? 'products' : emailVerified ? null : 'email';
  return { items, done: items.filter((item) => item.done).length, total: items.length, blocker };
}
