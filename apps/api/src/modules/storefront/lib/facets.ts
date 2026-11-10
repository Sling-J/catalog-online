import type { StorefrontFacets } from '@catalog/contract';

/** Фильтры по вариантам (FR-V4): значения свойств и цена. */
export type VariantFilters = { valueIds: string[]; priceMin?: number; priceMax?: number };

/** Вариант в наличии из выборки (магазин, категория, поиск уже учтены запросом). */
export type FacetVariant = { productId: string; price: number; valueIds: string[] };

export type FacetAttribute = {
  id: string;
  name: string;
  inFilters: boolean;
  values: { id: string; value: string }[];
};

/**
 * Выбранные значения по свойствам: внутри свойства — ИЛИ, между свойствами — И. Неизвестные id (значение удалили,
 * а ссылка с фильтром осталась) пропускаем — фильтр по ним не сужает выборку до пустой.
 */
export function groupValues(valueIds: string[], attributeOf: ReadonlyMap<string, string>): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const id of new Set(valueIds)) {
    const attributeId = attributeOf.get(id);
    if (!attributeId) continue;
    groups.set(attributeId, [...(groups.get(attributeId) ?? []), id]);
  }
  return groups;
}

/** Есть ли фильтр по вариантам: тогда закончившиеся товары в выборку не попадают (решение основателя 2026-11-10). */
export function hasVariantFilter(groups: ReadonlyMap<string, string[]>, filters: VariantFilters): boolean {
  return groups.size > 0 || filters.priceMin !== undefined || filters.priceMax !== undefined;
}

type Skip = { attributeId?: string; price?: boolean };

function matches(
  variant: FacetVariant,
  groups: ReadonlyMap<string, string[]>,
  filters: VariantFilters,
  skip: Skip = {},
): boolean {
  if (!skip.price) {
    if (filters.priceMin !== undefined && variant.price < filters.priceMin) return false;
    if (filters.priceMax !== undefined && variant.price > filters.priceMax) return false;
  }
  for (const [attributeId, ids] of groups) {
    if (attributeId === skip.attributeId) continue;
    if (!ids.some((id) => variant.valueIds.includes(id))) return false;
  }
  return true;
}

/**
 * Фасеты выборки (FR-V4) — по вариантам в наличии, как в моках (`fixtures/filtering.ts`). Значения свойства
 * считаются без фильтра по самому свойству (иначе после выбора размера пропали бы остальные), цены — без фильтра
 * по цене. Число у значения — товары, а не варианты. Показываются свойства «в фильтрах» и значения с товарами.
 * `total` — товары в наличии с подходящим вариантом; закончившиеся (если магазин их показывает) добавляет сервис.
 */
export function computeFacets(
  variants: FacetVariant[],
  attributes: FacetAttribute[],
  filters: VariantFilters,
): StorefrontFacets {
  const attributeOf = new Map(attributes.flatMap((a) => a.values.map((v) => [v.id, a.id] as const)));
  const groups = groupValues(filters.valueIds, attributeOf);

  const total = new Set(variants.filter((v) => matches(v, groups, filters)).map((v) => v.productId)).size;

  const facetAttributes = attributes
    .filter((attribute) => attribute.inFilters)
    .map((attribute) => {
      const productsByValue = new Map<string, Set<string>>();
      for (const variant of variants) {
        if (!matches(variant, groups, filters, { attributeId: attribute.id })) continue;
        for (const id of variant.valueIds) {
          if (attributeOf.get(id) !== attribute.id) continue;
          productsByValue.set(id, (productsByValue.get(id) ?? new Set()).add(variant.productId));
        }
      }
      const values = attribute.values
        .map((value) => ({ id: value.id, value: value.value, count: productsByValue.get(value.id)?.size ?? 0 }))
        .filter((value) => value.count > 0);
      return { id: attribute.id, name: attribute.name, values };
    })
    .filter((attribute) => attribute.values.length > 0);

  let min = Infinity;
  let max = -Infinity;
  for (const variant of variants) {
    if (!matches(variant, groups, filters, { price: true })) continue;
    min = Math.min(min, variant.price);
    max = Math.max(max, variant.price);
  }

  return {
    total,
    attributes: facetAttributes,
    price: Number.isFinite(min) ? { min, max } : { min: 0, max: 0 },
  };
}
