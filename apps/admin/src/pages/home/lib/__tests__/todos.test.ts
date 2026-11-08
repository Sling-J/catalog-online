import { describe, expect, it } from 'vitest';

import { buildTodos } from '../todos';

describe('«Нужно сделать» на главной', () => {
  it('всё в порядке — остаётся только обновить остатки', () => {
    expect(buildTodos({ emailVerified: true, noPhoto: 0, outOfStock: 0 })).toEqual(['import']);
  });

  it('все дела по порядку: почта, без фото, нет в наличии, Excel', () => {
    expect(buildTodos({ emailVerified: false, noPhoto: 20, outOfStock: 4 })).toEqual([
      'email',
      'no_photo',
      'out_of_stock',
      'import',
    ]);
  });
});
