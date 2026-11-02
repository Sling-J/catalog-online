import type { ProductFilter, ProductListParams } from '@/entities/product';

/** Выбор в списке товаров, как он записан в адресе: `?q=…&filter=no_photo&category=<id>`. */
export type ProductsSearch = { q?: string; filter?: ProductFilter; category?: string };

const FILTERS: ProductFilter[] = ['no_photo', 'out_of_stock', 'hidden'];

/** Разбор адреса: незнакомое отбрасываем, пустое не пишем. */
export function validateProductsSearch(raw: Record<string, unknown>): ProductsSearch {
  const search: ProductsSearch = {};
  if (typeof raw.q === 'string' && raw.q.trim()) search.q = raw.q.trim().slice(0, 100);
  if (FILTERS.includes(raw.filter as ProductFilter)) search.filter = raw.filter as ProductFilter;
  if (typeof raw.category === 'string' && raw.category) search.category = raw.category;
  return search;
}

export const toListParams = (search: ProductsSearch): ProductListParams => ({
  q: search.q,
  filter: search.filter,
  categoryId: search.category,
});
