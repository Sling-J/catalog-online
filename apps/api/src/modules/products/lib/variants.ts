import type { VariantInput } from '@catalog/contract';

import type { FieldError } from '../../../core/errors/index.js';

/** Строка таблицы размеров после очистки: пробелы по краям сняты, пустой артикул — «придумать». */
export type CleanVariant = {
  id: string | null;
  sku: string | null;
  barcode: string | null;
  price: number;
  stock: number;
  values: { attributeId: string; value: string }[];
};

export function cleanVariants(inputs: VariantInput[]): CleanVariant[] {
  return inputs.map((input) => ({
    id: input.id ?? null,
    sku: input.sku?.trim() || null,
    barcode: input.barcode?.trim() || null,
    price: input.price,
    stock: input.stock,
    values: input.values.map((item) => ({ attributeId: item.attributeId, value: item.value.trim() })),
  }));
}

/**
 * Проверки таблицы без базы: повтор id или артикула, пустое значение, одно свойство дважды в строке, две строки с
 * одинаковым набором размеров (у товара без размеров — одна строка без значений). Ошибки — по ячейкам.
 */
export function variantTableErrors(variants: CleanVariant[]): FieldError[] {
  const errors: FieldError[] = [];
  const ids = new Set<string>();
  const skus = new Set<string>();
  const combos = new Set<string>();
  variants.forEach((variant, i) => {
    if (variant.id) {
      if (ids.has(variant.id)) errors.push({ field: `variants.${i}.id`, code: 'duplicate' });
      ids.add(variant.id);
    }
    if (variant.sku) {
      if (skus.has(variant.sku)) errors.push({ field: `variants.${i}.sku`, code: 'duplicate' });
      skus.add(variant.sku);
    }
    const attributes = new Set<string>();
    variant.values.forEach((item, j) => {
      if (!item.value) errors.push({ field: `variants.${i}.values.${j}.value`, code: 'required' });
      if (attributes.has(item.attributeId)) {
        errors.push({ field: `variants.${i}.values.${j}.attributeId`, code: 'duplicate' });
      }
      attributes.add(item.attributeId);
    });
    const combo = variant.values
      .map((item) => `${item.attributeId}:${item.value.toLowerCase()}`)
      .sort()
      .join('|');
    if (combos.has(combo)) errors.push({ field: `variants.${i}.values`, code: 'duplicate' });
    combos.add(combo);
  });
  return errors;
}
