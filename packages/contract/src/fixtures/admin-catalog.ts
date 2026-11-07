// Категории и свойства админки на моках (T-311): правки живут в памяти, пока открыта страница.
// Поведение — как у будущего API (FR-A6, data-model.md): имя категории уникально среди соседей (одного родителя),
// не больше 2 уровней; удаление категории оставляет товары без категории, категорию с подкатегориями удалить нельзя
// (409 `category_has_children`). Имя свойства уникально в магазине, значение — в свойстве (повтор — 409
// `attribute_value_taken`); значение, которое стоит у вариантов, удалить нельзя (409 `attribute_value_in_use`);
// удаление свойства снимает его значения с вариантов.
import type { Attribute, Category, Product } from '../gen/types.gen.js';
import { demoCategories } from './demo-shop.js';

/** Категория в «базе» моков: плоская запись, дерево собирается при ответе. */
export type CategoryRecord = { id: string; name: string; parentId: string | null; position: number };

export const demoCategoryRecords = (): CategoryRecord[] =>
  demoCategories.map((category, position) => ({ id: category.id, name: category.name, parentId: null, position }));

const same = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

/** Дерево категорий с числом товаров (у родителя — только его собственные товары, как в контракте). */
export const categoryTree = (records: CategoryRecord[], products: Product[]): Category[] => {
  const build = (parentId: string | null): Category[] =>
    records
      .filter((record) => record.parentId === parentId)
      .sort(byPosition)
      .map((record) => ({
        ...record,
        productCount: products.filter((product) => product.categoryId === record.id).length,
        children: parentId === null ? build(record.id) : [],
      }));
  return build(null);
};

/** Все категории плоским списком — для подписи категории в строке товара. */
export const flatCategories = (tree: Category[]): Category[] =>
  tree.flatMap((category) => [category, ...flatCategories(category.children)]);

export type CatalogOutcome<T> = T | 'not_found' | 'conflict' | 'invalid';

export const createCategory = (
  records: CategoryRecord[],
  name: string,
  parentId: string | null,
): CatalogOutcome<CategoryRecord> => {
  const trimmed = name.trim();
  if (!trimmed) return 'invalid';
  if (parentId) {
    const parent = records.find((record) => record.id === parentId);
    // внутрь подкатегории нельзя — не больше 2 уровней
    if (!parent || parent.parentId !== null) return 'invalid';
  }
  const siblings = records.filter((record) => record.parentId === parentId);
  if (siblings.some((record) => same(record.name, trimmed))) return 'conflict';
  const created = { id: crypto.randomUUID(), name: trimmed, parentId, position: siblings.length };
  records.push(created);
  return created;
};

export const renameCategory = (records: CategoryRecord[], id: string, name: string): CatalogOutcome<CategoryRecord> => {
  const record = records.find((item) => item.id === id);
  if (!record) return 'not_found';
  const trimmed = name.trim();
  if (!trimmed) return 'invalid';
  if (records.some((item) => item.id !== id && item.parentId === record.parentId && same(item.name, trimmed)))
    return 'conflict';
  record.name = trimmed;
  return record;
};

/**
 * Порядок и вложенность целиком (`PUT /categories/order`): ровно те же категории, родитель — категория верхнего
 * уровня, у которой самой нет родителя, категория с подкатегориями не может стать вложенной. Позиции
 * пересчитываются по порядку внутри родителя.
 */
export const reorderCategories = (
  records: CategoryRecord[],
  items: { id: string; parentId: string | null; position: number }[],
): CatalogOutcome<CategoryRecord[]> => {
  const ids = new Set(records.map((record) => record.id));
  if (items.length !== ids.size || new Set(items.map((item) => item.id)).size !== ids.size) return 'invalid';
  if (items.some((item) => !ids.has(item.id))) return 'invalid';
  const parentOf = new Map(items.map((item) => [item.id, item.parentId]));
  for (const item of items) {
    if (item.parentId === null) continue;
    if (item.parentId === item.id || !ids.has(item.parentId) || parentOf.get(item.parentId) !== null) return 'invalid';
    if (items.some((other) => other.parentId === item.id)) return 'invalid';
  }
  // одинаковые имена у новых соседей
  const names = new Map(records.map((record) => [record.id, record.name.trim().toLowerCase()]));
  const seen = new Set<string>();
  for (const item of items) {
    const key = `${item.parentId ?? ''}/${names.get(item.id)}`;
    if (seen.has(key)) return 'conflict';
    seen.add(key);
  }
  const groups = new Map<string | null, typeof items>();
  for (const item of items) groups.set(item.parentId, [...(groups.get(item.parentId) ?? []), item]);
  for (const group of groups.values()) {
    group.sort(byPosition).forEach((item, position) => {
      const record = records.find((entry) => entry.id === item.id)!;
      record.parentId = item.parentId;
      record.position = position;
    });
  }
  return records;
};

/**
 * Удалить категорию: товары остаются без категории, соседи после неё сдвигаются. Категорию с подкатегориями
 * удалить нельзя (409 `category_has_children`) — сначала их переносят или удаляют.
 */
export const deleteCategory = (
  records: CategoryRecord[],
  products: Product[],
  id: string,
): 'deleted' | 'not_found' | 'has_children' => {
  const index = records.findIndex((record) => record.id === id);
  if (index < 0) return 'not_found';
  if (records.some((record) => record.parentId === id)) return 'has_children';
  const removed = records[index]!;
  records.splice(index, 1);
  products.forEach((product, productIndex) => {
    if (product.categoryId === id) products[productIndex] = { ...product, categoryId: null };
  });
  records
    .filter((record) => record.parentId === removed.parentId)
    .sort(byPosition)
    .forEach((record, position) => (record.position = position));
  return 'deleted';
};

// ───────────────────────── Свойства ─────────────────────────

/** Сколько вариантов используют каждое значение — считается по товарам при каждом ответе. */
export const withUsage = (attribute: Attribute, products: Product[]): Attribute => ({
  ...attribute,
  values: attribute.values.map((entry) => ({
    ...entry,
    usageCount: products.reduce(
      (sum, product) =>
        sum + product.variants.filter((variant) => variant.values.some((value) => value.valueId === entry.id)).length,
      0,
    ),
  })),
});

const uniqueValues = (values: string[]): string[] => {
  const result: string[] = [];
  for (const value of values.map((item) => item.trim()).filter(Boolean))
    if (!result.some((item) => same(item, value))) result.push(value);
  return result;
};

export const createAttribute = (
  attributes: Attribute[],
  body: { name: string; inFilters?: boolean; values?: string[] },
): CatalogOutcome<Attribute> => {
  const name = body.name.trim();
  if (!name) return 'invalid';
  if (attributes.some((item) => same(item.name, name))) return 'conflict';
  const created: Attribute = {
    id: crypto.randomUUID(),
    name,
    position: attributes.length,
    inFilters: body.inFilters ?? true,
    values: uniqueValues(body.values ?? []).map((value, position) => ({
      id: crypto.randomUUID(),
      value,
      position,
      usageCount: 0,
    })),
  };
  attributes.push(created);
  return created;
};

export const updateAttribute = (
  attributes: Attribute[],
  products: Product[],
  id: string,
  body: { name?: string; inFilters?: boolean },
): CatalogOutcome<Attribute> => {
  const index = attributes.findIndex((item) => item.id === id);
  if (index < 0) return 'not_found';
  const name = body.name?.trim();
  if (name !== undefined) {
    if (!name) return 'invalid';
    if (attributes.some((item) => item.id !== id && same(item.name, name))) return 'conflict';
  }
  const updated = {
    ...attributes[index]!,
    ...(name !== undefined && { name }),
    ...(body.inFilters !== undefined && { inFilters: body.inFilters }),
  };
  attributes[index] = updated;
  if (name !== undefined) renameInVariants(products, (value) => value.attributeId === id, { attributeName: name });
  return updated;
};

/** Удалить свойство: его значения снимаются с вариантов. */
export const deleteAttribute = (attributes: Attribute[], products: Product[], id: string): boolean => {
  const index = attributes.findIndex((item) => item.id === id);
  if (index < 0) return false;
  attributes.splice(index, 1);
  attributes.forEach((item, position) => (attributes[position] = { ...item, position }));
  products.forEach((product, productIndex) => {
    if (!product.variants.some((variant) => variant.values.some((value) => value.attributeId === id))) return;
    products[productIndex] = {
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        values: variant.values.filter((value) => value.attributeId !== id),
      })),
    };
  });
  return true;
};

type VariantValue = Product['variants'][number]['values'][number];

const renameInVariants = (
  products: Product[],
  match: (value: VariantValue) => boolean,
  patch: Partial<Pick<VariantValue, 'attributeName' | 'value'>>,
) => {
  products.forEach((product, productIndex) => {
    if (!product.variants.some((variant) => variant.values.some(match))) return;
    products[productIndex] = {
      ...product,
      variants: product.variants.map((variant) => ({
        ...variant,
        values: variant.values.map((value) => (match(value) ? { ...value, ...patch } : value)),
      })),
    };
  });
};

/**
 * Значения свойства целиком (`PUT /attributes/{id}/values`): с id — переименовать и переставить, без id — добавить,
 * которых нет в списке — удалить. Неизвестный id или пустое значение — 422; повтор — 409 `attribute_value_taken`
 * с номером повторившегося (`{ taken: 3 }`); удаление значения, которое стоит у вариантов, — 409
 * `attribute_value_in_use`.
 */
export const replaceAttributeValues = (
  attributes: Attribute[],
  products: Product[],
  id: string,
  values: { id?: string; value: string }[],
): CatalogOutcome<Attribute> | 'in_use' | { taken: number } => {
  const index = attributes.findIndex((item) => item.id === id);
  if (index < 0) return 'not_found';
  const current = withUsage(attributes[index]!, products);
  const byId = new Map(current.values.map((entry) => [entry.id, entry]));
  if (values.some((entry) => !entry.value.trim() || (entry.id && !byId.has(entry.id)))) return 'invalid';
  const taken = values.findIndex((entry, index) =>
    values.slice(0, index).some((other) => same(other.value, entry.value)),
  );
  if (taken >= 0) return { taken };
  const kept = new Set(values.flatMap((entry) => entry.id ?? []));
  if (current.values.some((entry) => !kept.has(entry.id) && entry.usageCount > 0)) return 'in_use';
  const next: Attribute = {
    ...current,
    values: values.map((entry, position) => ({
      id: entry.id ?? crypto.randomUUID(),
      value: entry.value.trim(),
      position,
      usageCount: entry.id ? byId.get(entry.id)!.usageCount : 0,
    })),
  };
  attributes[index] = next;
  for (const entry of next.values) {
    const before = byId.get(entry.id);
    if (before && before.value !== entry.value)
      renameInVariants(products, (value) => value.valueId === entry.id, { value: entry.value });
  }
  return next;
};
