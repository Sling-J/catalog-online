import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import { buildDemoRows } from './demo-shop.js';
import { forLanding, LANDING_HIDDEN, LANDING_PHOTOS } from './landing-demo.js';
import { DEMO_PHOTOS_DIR } from './photos.js';

describe('демо для лендинга (storefront.md S12)', () => {
  const rows = forLanding(buildDemoRows('hash', Date.parse('2026-11-14T00:00:00Z')));

  it('у каждого видимого товара есть фото, три без подходящего фото скрыты', () => {
    const withPhoto = new Set(rows.productPhotos.map((photo) => photo.productId));
    const visible = rows.products.filter((product) => product.isVisible);
    expect(visible.filter((product) => !withPhoto.has(product.id!)).map((product) => product.name)).toEqual([]);
    for (const name of LANDING_HIDDEN) {
      expect(rows.products.find((product) => product.name === name)?.isVisible).toBe(false);
    }
  });

  it('названия в карте фото есть в демо, файлы фото лежат в design-assets, id фото не повторяются', () => {
    const names = new Set(rows.products.map((product) => product.name));
    expect(Object.keys(LANDING_PHOTOS).filter((name) => !names.has(name))).toEqual([]);
    for (const file of Object.values(LANDING_PHOTOS))
      expect(existsSync(resolve(DEMO_PHOTOS_DIR, `${file}.jpg`))).toBe(true);
    const ids = rows.productPhotos.map((photo) => photo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
