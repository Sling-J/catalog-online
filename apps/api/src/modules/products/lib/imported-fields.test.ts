import { describe, expect, it } from 'vitest';

import { nextImportedFields } from './imported-fields.js';

const product = { name: 'Куртка', categoryId: 'c1', importedFields: ['name', 'category', 'variants'] as const };
const current = { ...product, importedFields: [...product.importedFields] };

describe('пометки «из Excel» после правки', () => {
  it('изменённое руками название или категория теряет пометку; то же значение — нет', () => {
    expect(nextImportedFields(current, { name: 'Куртка' })).toEqual(['name', 'category', 'variants']);
    expect(nextImportedFields(current, { name: 'Куртка зимняя' })).toEqual(['category', 'variants']);
    expect(nextImportedFields(current, { categoryId: null })).toEqual(['name', 'variants']);
    expect(nextImportedFields(current, {})).toEqual(['name', 'category', 'variants']);
  });

  it('«брать из Excel»: пометки на названии и категории — ровно как переданы, variants не трогается', () => {
    const edited = { ...current, importedFields: ['variants' as const] };
    expect(nextImportedFields(edited, { name: 'Новое' }, ['category', 'name'])).toEqual([
      'name',
      'category',
      'variants',
    ]);
    expect(nextImportedFields(current, {}, [])).toEqual(['variants']);
    expect(nextImportedFields({ ...current, importedFields: [] }, {}, ['name'])).toEqual(['name']);
  });
});
