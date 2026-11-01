import type { ProductListParams, ProductSort } from '@/entities/product/api';

/**
 * Что каталог хранит в адресе: категория, сортировка, поиск и фильтры. Значения по умолчанию в адрес не попадают.
 * `values` — id выбранных значений через запятую, как в контракте API.
 */
export type CatalogSearch = {
  category?: string;
  sort?: ProductSort;
  q?: string;
  values?: string;
  priceMin?: number;
  priceMax?: number;
};

const SORTS: readonly string[] = ['new', 'price_asc', 'price_desc'];
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_VALUES = 50;
const MAX_QUERY_LENGTH = 100;

const isMoney = (value: unknown): value is number =>
  typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

/** Разбор адреса: всё лишнее и неверное молча отбрасываем, чтобы кривая ссылка открывала каталог, а не ошибку. */
export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const search: CatalogSearch = {};
  if (typeof raw.category === 'string' && raw.category.length > 0 && raw.category.length <= 64) {
    search.category = raw.category;
  }
  if (typeof raw.sort === 'string' && raw.sort !== 'new' && SORTS.includes(raw.sort)) {
    search.sort = raw.sort as ProductSort;
  }
  if (typeof raw.q === 'string') {
    const q = raw.q.trim().slice(0, MAX_QUERY_LENGTH);
    if (q) search.q = q;
  }
  if (typeof raw.values === 'string') {
    const ids = raw.values
      .split(',')
      .filter((id) => UUID.test(id))
      .slice(0, MAX_VALUES);
    if (ids.length > 0) search.values = ids.join(',');
  }
  if (isMoney(raw.priceMin)) search.priceMin = raw.priceMin;
  if (isMoney(raw.priceMax)) search.priceMax = raw.priceMax;
  return search;
}

/** Id выбранных значений фильтров. */
export const selectedValues = (search: CatalogSearch): string[] => search.values?.split(',').filter(Boolean) ?? [];

/** Параметры запроса товаров по адресу страницы. */
export function toProductParams(search: CatalogSearch): ProductListParams {
  const values = selectedValues(search);
  return {
    categoryId: search.category,
    sort: search.sort,
    q: search.q,
    values: values.length > 0 ? values : undefined,
    priceMin: search.priceMin,
    priceMax: search.priceMax,
  };
}
