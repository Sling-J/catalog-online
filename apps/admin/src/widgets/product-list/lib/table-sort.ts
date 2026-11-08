import type { ProductSort } from '@/entities/product';

/** Колонки таблицы, по которым можно упорядочить список (`sort` у listProducts). */
export type SortColumn = 'name' | 'price' | 'stock';

/**
 * Следующий порядок по нажатию на заголовок колонки: «Название» — по алфавиту и обратно к новым, «Цена» —
 * дешёвые → дорогие → новые, «Остаток» — меньше остаток → новые (обратного порядка у API нет).
 * `undefined` — порядок по умолчанию, «Сначала новые».
 */
export function nextSort(column: SortColumn, current: ProductSort | undefined): ProductSort | undefined {
  switch (column) {
    case 'name':
      return current === 'name' ? undefined : 'name';
    case 'price':
      return current === 'price_asc' ? 'price_desc' : current === 'price_desc' ? undefined : 'price_asc';
    case 'stock':
      return current === 'stock_asc' ? undefined : 'stock_asc';
  }
}

/** Направление стрелки в заголовке колонки или `null`, если список упорядочен не по ней. */
export function sortDirection(column: SortColumn, current: ProductSort | undefined): 'asc' | 'desc' | null {
  if (column === 'name') return current === 'name' ? 'asc' : null;
  if (column === 'stock') return current === 'stock_asc' ? 'asc' : null;
  return current === 'price_asc' ? 'asc' : current === 'price_desc' ? 'desc' : null;
}
