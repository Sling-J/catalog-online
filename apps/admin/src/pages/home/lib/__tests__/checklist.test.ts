import { describe, expect, it } from 'vitest';

import { buildChecklist } from '../checklist';

const readiness = { settingsFilled: true, productCount: 214, productsWithoutPhoto: 37, canPublish: true };

describe('чек-лист главной', () => {
  it('почта подтверждена: создан, товары, фото, публикация — 2 из 4', () => {
    const list = buildChecklist(readiness, true);
    expect(list.items.map((item) => item.key)).toEqual(['created', 'products', 'photos', 'publish']);
    expect([list.done, list.total]).toEqual([2, 4]);
  });

  it('почта не подтверждена — пятый пункт', () => {
    const list = buildChecklist(readiness, false);
    expect(list.items.map((item) => item.key)).toContain('email');
    expect([list.done, list.total]).toEqual([2, 5]);
  });

  it('сразу после мастера: магазин создан засчитан — 1 из 5, фото серое, «о магазине» не сделан', () => {
    const list = buildChecklist(
      { settingsFilled: false, productCount: 0, productsWithoutPhoto: 0, canPublish: false },
      false,
    );
    expect(list.items[0]).toEqual({ key: 'created', done: true });
    expect(list.items.find((item) => item.key === 'photos')).toMatchObject({ done: false, muted: true });
    expect([list.done, list.total, list.about.done]).toEqual([1, 5, false]);
  });

  it('у всех товаров фото — пункт сделан', () => {
    expect(buildChecklist({ ...readiness, productsWithoutPhoto: 0 }, true).done).toBe(3);
  });
});
