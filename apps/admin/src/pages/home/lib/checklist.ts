import type { Shop } from '@catalog/contract';

export type ChecklistKey = 'created' | 'products' | 'photos' | 'email' | 'publish';

export type ChecklistItem = {
  key: ChecklistKey;
  done: boolean;
  /** Пункт пока не к чему применить (фото, когда товаров нет) — подпись серая, без действия. */
  muted?: boolean;
};

/**
 * Чек-лист главной до публикации (FR-A2; UX-аудит, L1). Мастер пройден — значит, «Магазин создан» уже сделан:
 * человек только что настроил магазин, и «0 из 5» звучало бы как «ничего не сделано». Адрес и график — отдельный
 * необязательный пункт «Расскажите о магазине» (`about`), в счёт готовности не входит. Пункт почты — только пока
 * она не подтверждена; публикация — всегда последняя и всегда не сделана.
 */
export function buildChecklist(readiness: Shop['readiness'], emailVerified: boolean) {
  const { settingsFilled, productCount, productsWithoutPhoto } = readiness;
  const items: ChecklistItem[] = [
    { key: 'created', done: true },
    { key: 'products', done: productCount > 0 },
    productCount === 0
      ? { key: 'photos', done: false, muted: true }
      : { key: 'photos', done: productsWithoutPhoto === 0 },
    ...(emailVerified ? [] : [{ key: 'email' as const, done: false }]),
    { key: 'publish', done: false },
  ];
  return {
    items,
    done: items.filter((item) => item.done).length,
    total: items.length,
    about: { done: settingsFilled },
  };
}
