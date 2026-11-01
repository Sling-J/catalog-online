// Фильтрация демо-магазина для моков: поиск, категория, значения свойств, цена, сортировка и фасеты.
// Повторяет смысл контракта (FR-V3–V5), но без оптимизаций: товаров в демо немного.
import type { StorefrontFacets, StorefrontProduct, StorefrontProductCard } from '../gen/types.gen.js';
import type { DemoShopData } from './demo-shop.js';

export type CatalogFilters = {
  categoryId?: string;
  q?: string;
  /** Id значений свойств: внутри свойства — ИЛИ, между свойствами — И. */
  values: string[];
  priceMin?: number;
  priceMax?: number;
  sort?: string;
};

const optionalNumber = (raw: string | null): number | undefined => {
  if (raw === null || raw === '') return undefined;
  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
};

export const readFilters = (url: URL): CatalogFilters => {
  const params = url.searchParams;
  return {
    categoryId: params.get('categoryId') || undefined,
    q: params.get('q')?.toLowerCase() || undefined,
    values: params.get('values')?.split(',').filter(Boolean) ?? [],
    priceMin: optionalNumber(params.get('priceMin')),
    priceMax: optionalNumber(params.get('priceMax')),
    sort: params.get('sort') ?? undefined,
  };
};

type Variant = StorefrontProduct['variants'][number];
type Skip = { price?: boolean; attributeId?: string };

/** Выбранные значения, сгруппированные по свойству. */
const groupByAttribute = (values: string[], data: DemoShopData, skipAttributeId?: string) => {
  const attributeOf = new Map<string, string>();
  for (const attribute of data.facets.attributes) {
    for (const value of attribute.values) attributeOf.set(value.id, attribute.id);
  }
  const groups = new Map<string, Set<string>>();
  for (const id of values) {
    const attributeId = attributeOf.get(id);
    if (!attributeId || attributeId === skipAttributeId) continue;
    groups.set(attributeId, (groups.get(attributeId) ?? new Set()).add(id));
  }
  return groups;
};

const variantMatches = (variant: Variant, groups: Map<string, Set<string>>, filters: CatalogFilters, skip: Skip) => {
  if (variant.stock.level === 'out') return false;
  if (!skip.price) {
    if (filters.priceMin !== undefined && variant.price < filters.priceMin) return false;
    if (filters.priceMax !== undefined && variant.price > filters.priceMax) return false;
  }
  return [...groups.values()].every((ids) => variant.valueIds.some((id) => ids.has(id)));
};

const productMatches = (product: StorefrontProduct, filters: CatalogFilters, data: DemoShopData, skip: Skip = {}) => {
  if (filters.categoryId && product.category?.id !== filters.categoryId) return false;
  if (filters.q && !product.name.toLowerCase().includes(filters.q)) return false;
  const groups = groupByAttribute(filters.values, data, skip.attributeId);
  const priceActive = !skip.price && (filters.priceMin !== undefined || filters.priceMax !== undefined);
  // без фильтров по вариантам товар попадает в выборку сам по себе
  if (groups.size === 0 && !priceActive) return true;
  return product.variants.some((variant) => variantMatches(variant, groups, filters, skip));
};

/** Карточки выборки в нужном порядке. */
export const selectCards = (data: DemoShopData, filters: CatalogFilters): StorefrontProductCard[] => {
  const ids = new Set(data.products.filter((product) => productMatches(product, filters, data)).map((p) => p.id));
  const cards = data.cards.filter((card) => ids.has(card.id));
  if (filters.sort === 'price_asc') cards.sort((a, b) => a.price - b.price);
  if (filters.sort === 'price_desc') cards.sort((a, b) => b.price - a.price);
  return cards;
};

/**
 * Фасеты выборки. Значения свойства считаются без фильтра по самому свойству (иначе после выбора
 * размера пропали бы остальные), цены — без фильтра по цене. Значения без товаров не показываем.
 */
export const computeFacets = (data: DemoShopData, filters: CatalogFilters): StorefrontFacets => {
  const total = data.products.filter((product) => productMatches(product, filters, data)).length;

  const attributes = data.facets.attributes
    .map((attribute) => {
      const pool = data.products.filter((product) =>
        productMatches(product, filters, data, { attributeId: attribute.id }),
      );
      const values = attribute.values
        .map((value) => ({
          ...value,
          count: pool.filter((product) =>
            product.variants.some((variant) => variant.stock.level !== 'out' && variant.valueIds.includes(value.id)),
          ).length,
        }))
        .filter((value) => value.count > 0);
      return { ...attribute, values };
    })
    .filter((attribute) => attribute.values.length > 0);

  const prices = data.products
    .filter((product) => productMatches(product, filters, data, { price: true }))
    .flatMap((product) => product.variants.filter((variant) => variant.stock.level !== 'out'))
    .map((variant) => variant.price);

  return {
    total,
    attributes,
    price: prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : { min: 0, max: 0 },
  };
};
