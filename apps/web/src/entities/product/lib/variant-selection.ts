import type { StorefrontProduct } from '@catalog/contract';

type Variant = StorefrontProduct['variants'][number];

/** Выбор покупателя: id свойства → id значения. */
export type Selection = Record<string, string>;

/** `out` — вариант есть, но закончился; `impossible` — такого сочетания у товара нет. */
export type ValueState = 'available' | 'out' | 'impossible';

export const isInStock = (variant: Variant): boolean => variant.stock.level !== 'out';

/** Вариант по выбору. У товара без свойств он единственный; пока выбраны не все свойства — `undefined`. */
export function findVariant(product: StorefrontProduct, selection: Selection): Variant | undefined {
  if (product.attributes.length === 0) return product.variants[0];
  if (product.attributes.some((attribute) => !selection[attribute.id])) return undefined;
  const wanted = new Set(Object.values(selection));
  return product.variants.find(
    (variant) => variant.valueIds.length === wanted.size && variant.valueIds.every((id) => wanted.has(id)),
  );
}

/** Можно ли выбрать значение при уже выбранных остальных свойствах. */
export function getValueState(
  product: StorefrontProduct,
  selection: Selection,
  attributeId: string,
  valueId: string,
): ValueState {
  const others = Object.entries(selection)
    .filter(([id]) => id !== attributeId)
    .map(([, id]) => id);
  const candidates = product.variants.filter(
    (variant) => variant.valueIds.includes(valueId) && others.every((id) => variant.valueIds.includes(id)),
  );
  if (candidates.length === 0) return 'impossible';
  return candidates.some(isInStock) ? 'available' : 'out';
}

/** Выбрать значение; повторное нажатие на выбранное снимает выбор. */
export function toggleSelection(selection: Selection, attributeId: string, valueId: string): Selection {
  if (selection[attributeId] === valueId) {
    const { [attributeId]: _removed, ...rest } = selection;
    return rest;
  }
  return { ...selection, [attributeId]: valueId };
}

/** Самая низкая и самая высокая цена по вариантам. */
export function getPriceRange(product: StorefrontProduct): { min: number; max: number } {
  const prices = product.variants.map((variant) => variant.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

/** Подпись варианта в формате заказа (FR-V8): «Рост: 104, Цвет: синий»; пусто, если свойств нет. */
export function describeVariant(product: StorefrontProduct, variant: Variant): string {
  const parts = product.attributes.flatMap((attribute) => {
    const value = attribute.values.find((entry) => variant.valueIds.includes(entry.id));
    return value ? `${attribute.name}: ${value.value}` : [];
  });
  return parts.join(', ');
}
