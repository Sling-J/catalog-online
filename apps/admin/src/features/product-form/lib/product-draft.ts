import type { Attribute, Product, ProductUpdate, VariantInput } from '@catalog/contract';

import type { DraftErrors, ProductDraft, VariantRow } from '../types';

/** Только цифры: «8 200 ₸» → «8200». */
export const digitsOf = (text: string): string => text.replace(/\D/g, '');

/** Подпись строки: значения свойств через точку («104», «104 · синий»). */
export const rowLabel = (row: VariantRow): string => row.values.map((value) => value.value).join(' · ');

/** Редактор сохранённого товара: строки — варианты как есть, свойство — у первого варианта. */
export function draftFromProduct(product: Product): ProductDraft {
  return {
    name: product.name,
    description: product.description ?? '',
    categoryId: product.categoryId,
    isVisible: product.isVisible,
    attributeId: product.variants[0]?.values[0]?.attributeId ?? null,
    price: '',
    stock: 0,
    rows: product.variants.map((variant) => ({
      key: variant.id,
      id: variant.id,
      values: variant.values.map(({ attributeId, value }) => ({ attributeId, value })),
      price: String(variant.price),
      stock: variant.stock,
      sku: variant.sku,
      barcode: variant.barcode ?? '',
    })),
  };
}

/** Новый товар: видимый, размеры по первому свойству магазина, строк пока нет. */
export function newProductDraft(attributes: Attribute[]): ProductDraft {
  return {
    name: '',
    description: '',
    categoryId: null,
    isVisible: true,
    attributeId: attributes[0]?.id ?? null,
    price: '',
    stock: 1,
    rows: [],
  };
}

/** Цена строки: своя или цена по умолчанию. */
export const rowPrice = (draft: ProductDraft, row: VariantRow): number => Number(row.price || draft.price || 0);

/**
 * Размеры, которые предлагаются чипами «+ 116»: значения свойства после последнего выбранного (как в макете —
 * следующие по порядку), без уже выбранных. Ничего не выбрано — все значения.
 */
export function nextSizes(attribute: Attribute | undefined, rows: VariantRow[]): string[] {
  if (!attribute) return [];
  const values = [...attribute.values].sort((a, b) => a.position - b.position).map((item) => item.value);
  const used = new Set(rows.flatMap((row) => row.values.map((value) => value.value.toLowerCase())));
  const last = Math.max(-1, ...values.map((value, index) => (used.has(value.toLowerCase()) ? index : -1)));
  return values.slice(last + 1).filter((value) => !used.has(value.toLowerCase()));
}

/** Таблица размеров для API; без строк — один вариант без размеров с количеством товара. */
export function toVariantInputs(draft: ProductDraft): VariantInput[] {
  if (draft.rows.length === 0) return [{ price: Number(draft.price || 0), stock: draft.stock, values: [] }];
  return draft.rows.map((row) => ({
    ...(row.id ? { id: row.id } : {}),
    sku: row.sku.trim() || null,
    barcode: row.barcode.trim() || null,
    price: rowPrice(draft, row),
    stock: row.stock,
    values: row.values.filter((value) => value.value.trim()),
  }));
}

/** Что проверить до отправки: название, цена у каждого размера, размер у новых строк, повторы размеров. */
export function validateDraft(draft: ProductDraft): DraftErrors {
  const errors: DraftErrors = {};
  if (!draft.name.trim()) errors.name = 'required';
  const prices = draft.rows.length ? draft.rows.map((row) => rowPrice(draft, row)) : [Number(draft.price || 0)];
  if (prices.some((price) => price <= 0)) {
    // у нового товара цену задают одну на все размеры — ошибка у поля «Цена»
    if (draft.rows.every((row) => !row.price)) errors.price = 'no_price';
    else errors.variants = 'no_price';
  }
  const labels = draft.rows.map((row) => rowLabel(row).trim().toLowerCase());
  if (!errors.variants && draft.rows.length > 1 && labels.some((label) => !label)) errors.variants = 'no_size';
  else if (!errors.variants && new Set(labels).size < labels.length) errors.variants = 'duplicate';
  return errors;
}

/** Изменённые поля карточки — тело PATCH; пусто — карточку сохранять не нужно. */
export function productChanges(product: Product, draft: ProductDraft): ProductUpdate {
  const changes: ProductUpdate = {};
  const name = draft.name.trim();
  const description = draft.description.trim() || null;
  if (name !== product.name) changes.name = name;
  if (description !== (product.description ?? null)) changes.description = description;
  if (draft.categoryId !== product.categoryId) changes.categoryId = draft.categoryId;
  if (draft.isVisible !== product.isVisible) changes.isVisible = draft.isVisible;
  return changes;
}

/** Поменялась ли таблица размеров (тогда её отправляют целиком). */
export function variantsChanged(product: Product, draft: ProductDraft): boolean {
  const saved = draftFromProduct(product);
  return JSON.stringify(toVariantInputs(saved)) !== JSON.stringify(toVariantInputs(draft));
}

let nextKey = 0;

/** Новая строка таблицы: размер выбран чипом или вписывается; цена пустая — цена по умолчанию; одна штука. */
export function newRow(attributeId: string | null, value: string, defaults: Partial<VariantRow> = {}): VariantRow {
  return {
    key: `new-${++nextKey}`,
    values: attributeId ? [{ attributeId, value }] : [],
    price: '',
    stock: 1,
    sku: '',
    barcode: '',
    ...defaults,
  };
}
