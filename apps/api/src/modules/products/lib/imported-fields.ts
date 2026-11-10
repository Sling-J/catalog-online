import type { ImportedField } from '../../../core/db/schema/index.js';

const ORDER: ImportedField[] = ['name', 'category', 'variants'];

/**
 * Пометки «из Excel» после правки товара (T-409). `chosen` — «Брать из Excel» из запроса: пометки на названии и
 * категории ровно такие; без него изменённое руками название или категория пометку теряют. `variants` правка
 * карточки не трогает. Порядок всегда один — как в контракте.
 */
export function nextImportedFields(
  current: { name: string; categoryId: string | null; importedFields: ImportedField[] },
  patch: { name?: string; categoryId?: string | null },
  chosen?: ('name' | 'category')[],
): ImportedField[] {
  const fields = new Set(current.importedFields);
  if (chosen) {
    for (const field of ['name', 'category'] as const) {
      if (chosen.includes(field)) fields.add(field);
      else fields.delete(field);
    }
  } else {
    if (patch.name !== undefined && patch.name !== current.name) fields.delete('name');
    if (patch.categoryId !== undefined && patch.categoryId !== current.categoryId) fields.delete('category');
  }
  return ORDER.filter((field) => fields.has(field));
}
