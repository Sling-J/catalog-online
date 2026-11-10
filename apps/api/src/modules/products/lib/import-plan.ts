import type { ImportedField } from '../../../core/db/schema/index.js';

/** Строка файла импорта после сопоставления колонок и проверки (FR-A3): одна строка — один вариант. */
export type ImportRow = {
  /** Номер строки в файле — для предпросмотра и ошибок. */
  number: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  /** «Код товара»; `null` — группируем по названию. */
  groupKey: string | null;
  barcode: string | null;
  /** Путь категории: `['Девочки', 'Куртки']`, не больше двух уровней. */
  category: string[] | null;
  description: string | null;
  /** Свойства с непустым значением: `{ name: 'Рост', value: '110' }`. */
  attributes: { name: string; value: string }[];
};

/** Что уже есть в магазине — всё, что нужно плану. Товары — от старых к новым. */
export type ShopIndex = {
  products: { id: string; groupKey: string | null; importedFields: ImportedField[] }[];
  variants: { id: string; sku: string; productId: string; stock: number; position: number }[];
};

export type PlanVariant = Pick<ImportRow, 'sku' | 'barcode' | 'price' | 'stock' | 'attributes'>;

export type ImportPlan = {
  /** Новые товары с их вариантами. */
  newProducts: {
    groupKey: string;
    name: string;
    description: string | null;
    category: string[] | null;
    variants: PlanVariant[];
  }[];
  /** Новые варианты существующих товаров; `firstPosition` — позиция первого из них. */
  addedVariants: { productId: string; firstPosition: number; variants: PlanVariant[] }[];
  /** Варианты, найденные по артикулу. */
  updatedVariants: (PlanVariant & { variantId: string; productId: string })[];
  /** Правки существующих товаров: `null` — поле не трогаем. */
  productPatches: { productId: string; name: string | null; category: string[] | null; groupKey: string | null }[];
  /** Существующие товары, которых коснулся файл. */
  touchedProductIds: string[];
  /** Варианты «из Excel» с остатком, артикулов которых нет в файле. */
  missing: { variantId: string; productId: string }[];
  /** Что станет с каждой строкой. */
  actions: { row: number; action: 'create' | 'update'; variantId: string | null }[];
};

/** Ключ группировки, когда «Кода товара» нет: название без учёта регистра и лишних пробелов (FR-A3). */
export const nameGroupKey = (name: string): string => name.trim().toLowerCase().replace(/\s+/g, ' ');

const groupKeyOf = (row: ImportRow): string => row.groupKey ?? nameGroupKey(row.name);

/**
 * Что импорт сделает с каталогом (FR-A3). Без базы: на вход строки файла и состояние магазина.
 *
 * - Артикул есть в магазине — обновляется этот вариант (в каком бы товаре он ни был).
 * - Артикула нет — вариант добавляется в товар своей группы («Код товара» или название): товар с таким ключом
 *   группы; иначе товар, в котором уже лежит другой артикул этой группы из файла; иначе — новый товар.
 * - Название и категория существующего товара меняются, только пока на поле стоит пометка «из Excel»: ручная
 *   правка её снимает (решение основателя 2026-11-10). Берутся из первой строки товара в файле.
 * - «Нет в файле» — варианты товаров с пометкой `variants` (пришли импортом), у которых остаток больше нуля:
 *   товары, заведённые руками, импорт не обнуляет (решение основателя 2026-11-10). `skusInFile` — артикулы строк
 *   с ошибками: они в файле есть, обнулять их нельзя.
 */
export function buildPlan(rows: ImportRow[], index: ShopIndex, skusInFile: string[] = []): ImportPlan {
  const productById = new Map(index.products.map((product) => [product.id, product]));
  const variantBySku = new Map(index.variants.map((variant) => [variant.sku, variant]));
  const productByGroup = new Map<string, string>();
  for (const product of index.products) {
    if (product.groupKey !== null && !productByGroup.has(product.groupKey)) {
      productByGroup.set(product.groupKey, product.id);
    }
  }
  // группа файла → товар, в котором уже лежит её артикул (товар заведён руками или ключ группы сменился)
  const productBySibling = new Map<string, string>();
  for (const row of rows) {
    const variant = variantBySku.get(row.sku);
    const group = groupKeyOf(row);
    if (variant && !productByGroup.has(group) && !productBySibling.has(group)) {
      productBySibling.set(group, variant.productId);
    }
  }

  const plan: ImportPlan = {
    newProducts: [],
    addedVariants: [],
    updatedVariants: [],
    productPatches: [],
    touchedProductIds: [],
    missing: [],
    actions: [],
  };
  const newByGroup = new Map<string, ImportPlan['newProducts'][number]>();
  const addedByProduct = new Map<string, PlanVariant[]>();
  const firstRow = new Map<string, ImportRow>();
  const firstCategory = new Map<string, string[]>();

  for (const row of rows) {
    const variant: PlanVariant = {
      sku: row.sku,
      barcode: row.barcode,
      price: row.price,
      stock: row.stock,
      attributes: row.attributes,
    };
    const existing = variantBySku.get(row.sku);
    const group = groupKeyOf(row);
    const productId = existing?.productId ?? productByGroup.get(group) ?? productBySibling.get(group);

    if (existing) {
      plan.updatedVariants.push({ ...variant, variantId: existing.id, productId: existing.productId });
      plan.actions.push({ row: row.number, action: 'update', variantId: existing.id });
    } else {
      plan.actions.push({ row: row.number, action: 'create', variantId: null });
    }

    if (productId === undefined) {
      let created = newByGroup.get(group);
      if (!created) {
        created = { groupKey: group, name: row.name, description: null, category: null, variants: [] };
        newByGroup.set(group, created);
        plan.newProducts.push(created);
      }
      created.variants.push(variant);
      created.description ??= row.description;
      created.category ??= row.category;
      continue;
    }
    if (!existing) addedByProduct.set(productId, [...(addedByProduct.get(productId) ?? []), variant]);
    if (!firstRow.has(productId)) firstRow.set(productId, row);
    if (row.category && !firstCategory.has(productId)) firstCategory.set(productId, row.category);
  }

  const lastPosition = new Map<string, number>();
  for (const variant of index.variants) {
    lastPosition.set(variant.productId, Math.max(lastPosition.get(variant.productId) ?? -1, variant.position));
  }
  for (const [productId, variants] of addedByProduct) {
    plan.addedVariants.push({ productId, firstPosition: (lastPosition.get(productId) ?? -1) + 1, variants });
  }

  const adoptedGroup = new Map<string, string>();
  for (const [group, productId] of productBySibling) {
    if (productById.get(productId)?.groupKey === null && !adoptedGroup.has(productId)) {
      adoptedGroup.set(productId, group);
    }
  }
  for (const [productId, row] of firstRow) {
    const product = productById.get(productId)!;
    plan.touchedProductIds.push(productId);
    const patch = {
      productId,
      name: product.importedFields.includes('name') ? row.name : null,
      category: product.importedFields.includes('category') ? (firstCategory.get(productId) ?? null) : null,
      groupKey: adoptedGroup.get(productId) ?? null,
    };
    if (patch.name !== null || patch.category !== null || patch.groupKey !== null) plan.productPatches.push(patch);
  }

  const inFile = new Set([...rows.map((row) => row.sku), ...skusInFile]);
  for (const variant of index.variants) {
    const fromExcel = productById.get(variant.productId)?.importedFields.includes('variants') ?? false;
    if (fromExcel && variant.stock > 0 && !inFile.has(variant.sku)) {
      plan.missing.push({ variantId: variant.id, productId: variant.productId });
    }
  }
  return plan;
}
