import { describe, expect, it } from 'vitest';

import { publishBlockers } from '../publish-blockers';

const readiness = { settingsFilled: true, productCount: 3, productsWithoutPhoto: 0, canPublish: true };

describe('что мешает опубликовать', () => {
  it('товары есть, почта подтверждена — ничего', () => {
    expect(publishBlockers(readiness, true)).toEqual([]);
  });

  it('новый магазин: обе причины сразу, сначала товары', () => {
    expect(publishBlockers({ ...readiness, productCount: 0 }, false)).toEqual(['products', 'email']);
  });

  it('только почта', () => {
    expect(publishBlockers(readiness, false)).toEqual(['email']);
  });
});
