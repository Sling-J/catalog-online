import type { ProductListParams, ProductSort } from '@/entities/product';

/** Что каталог хранит в адресе: выбранная категория и сортировка. Значения по умолчанию в адрес не попадают. */
export type CatalogSearch = { category?: string; sort?: ProductSort };

const SORTS: readonly string[] = ['new', 'price_asc', 'price_desc'];

/** Разбор адреса: всё лишнее и неверное молча отбрасываем, чтобы кривая ссылка открывала каталог, а не ошибку. */
export function validateCatalogSearch(raw: Record<string, unknown>): CatalogSearch {
  const search: CatalogSearch = {};
  if (typeof raw.category === 'string' && raw.category.length > 0 && raw.category.length <= 64) {
    search.category = raw.category;
  }
  if (typeof raw.sort === 'string' && raw.sort !== 'new' && SORTS.includes(raw.sort)) {
    search.sort = raw.sort as ProductSort;
  }
  return search;
}

/** Параметры запроса товаров по адресу страницы. */
export function toProductParams(search: CatalogSearch): ProductListParams {
  return { categoryId: search.category, sort: search.sort };
}
