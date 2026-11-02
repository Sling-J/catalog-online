import { describe, expect, it } from 'vitest';

import { buildChecklist } from '../checklist';

const readiness = { settingsFilled: true, productCount: 214, productsWithoutPhoto: 37, canPublish: true };

describe('чек-лист главной', () => {
  it('как в утверждённом экране: 2 из 4, почта подтверждена, публиковать можно', () => {
    const list = buildChecklist(readiness, true);
    expect(list.items.map((item) => item.key)).toEqual(['settings', 'products', 'photos', 'publish']);
    expect([list.done, list.total, list.blocker]).toEqual([2, 4, null]);
  });

  it('почта не подтверждена — пятый пункт и подпись «Сначала подтвердите почту»', () => {
    const list = buildChecklist(readiness, false);
    expect(list.items.map((item) => item.key)).toContain('email');
    expect([list.done, list.total, list.blocker]).toEqual([2, 5, 'email']);
  });

  it('новый магазин: 0 из 5, фото серое, сначала товары', () => {
    const list = buildChecklist(
      { settingsFilled: false, productCount: 0, productsWithoutPhoto: 0, canPublish: false },
      false,
    );
    expect(list.items.find((item) => item.key === 'photos')).toMatchObject({ done: false, muted: true });
    expect([list.done, list.total, list.blocker]).toEqual([0, 5, 'products']);
  });

  it('у всех товаров фото — пункт сделан', () => {
    expect(buildChecklist({ ...readiness, productsWithoutPhoto: 0 }, true).done).toBe(3);
  });
});
