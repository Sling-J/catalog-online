import { and, asc, count, desc, eq, exists, ilike, inArray, not, notExists, or, sql, type SQL } from 'drizzle-orm';
import type { InferInsertModel, InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { categories, productPhotos, products, variants } from '../../core/db/schema/index.js';
import type { Cursor } from '../../core/pagination/index.js';

export type ProductRow = InferSelectModel<typeof products>;
export type ProductSort = 'new' | 'name' | 'price_asc' | 'price_desc' | 'stock_asc';
export type ProductFilter = 'all' | 'no_photo' | 'out_of_stock' | 'hidden';
export type ProductListQuery = { q?: string; categoryId?: string; filter: ProductFilter; sort: ProductSort };
export type ProductListRow = ProductRow & { categoryName: string | null; sortKey: string | number };
export type ProductCounts = { all: number; noPhoto: number; outOfStock: number; hidden: number };
export type ReadinessCounts = { total: number; visible: number; withoutPhoto: number };

/**
 * Порядки списка (A34, A35). Каждый — выражение и направление; второй ключ — id в том же направлении, чтобы
 * закладка курсора `(значение, id)` сравнивалась одним условием. «Цена» — минимальная цена вариантов.
 */
const SORTS: Record<ProductSort, { expr: SQL; key: SQL; param: (key: string | number) => SQL; desc: boolean }> = {
  // дата строкой из базы — микросекунды не теряются (в Date JS только миллисекунды)
  new: {
    expr: sql`${products.createdAt}`,
    key: sql<string>`${products.createdAt}::text`,
    param: (key) => sql`${String(key)}::timestamptz`,
    desc: true,
  },
  name: {
    expr: sql`lower(${products.name})`,
    key: sql<string>`lower(${products.name})`,
    param: (key) => sql`${String(key)}`,
    desc: false,
  },
  price_asc: { expr: sql`${products.minPrice}`, key: sql`${products.minPrice}`, param: (key) => sql`${Number(key)}`, desc: false },
  price_desc: { expr: sql`${products.minPrice}`, key: sql`${products.minPrice}`, param: (key) => sql`${Number(key)}`, desc: true },
  stock_asc: { expr: sql`${products.totalStock}`, key: sql`${products.totalStock}`, param: (key) => sql`${Number(key)}`, desc: false },
}; // prettier-ignore

const hasNoPhoto = () =>
  notExists(sql`(select 1 from ${productPhotos} where ${productPhotos.productId} = ${products.id})`);

/** `%` и `_` в поиске — обычные символы. */
const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

function listConditions(shopId: string, query: ProductListQuery): SQL {
  const conditions: (SQL | undefined)[] = [eq(products.shopId, shopId)];
  if (query.categoryId) conditions.push(eq(products.categoryId, query.categoryId));
  if (query.filter === 'no_photo') conditions.push(hasNoPhoto());
  if (query.filter === 'out_of_stock') conditions.push(eq(products.totalStock, 0));
  if (query.filter === 'hidden') conditions.push(not(products.isVisible));
  const q = query.q?.trim();
  if (q) {
    const pattern = likePattern(q);
    conditions.push(
      or(
        ilike(products.name, pattern),
        exists(
          sql`(select 1 from ${variants} where ${variants.productId} = ${products.id} and (${variants.sku} ilike ${pattern} or ${variants.barcode} ilike ${pattern}))`,
        ),
      ),
    );
  }
  return and(...conditions)!;
}

/** Товары магазина (FR-A5). Все функции — по `shopId` (backend-structure.md, раздел 6). */
export const productsRepository = {
  /** Страница списка: фильтры, порядок, закладка курсора; на одну строку больше — понять, есть ли дальше. */
  async list(
    db: DbOrTx,
    shopId: string,
    query: ProductListQuery,
    cursor: Cursor | null,
    limit: number,
  ): Promise<ProductListRow[]> {
    const sort = SORTS[query.sort];
    const where = [listConditions(shopId, query)];
    if (cursor) {
      const op = sort.desc ? sql`<` : sql`>`;
      where.push(sql`(${sort.expr}, ${products.id}) ${op} (${sort.param(cursor.key)}, ${cursor.id}::uuid)`);
    }
    const direction = sort.desc ? desc : asc;
    const rows = await db
      .select({ product: products, categoryName: categories.name, sortKey: sort.key })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(...where))
      .orderBy(direction(sort.expr), direction(products.id))
      .limit(limit + 1);
    return rows.map((row) => ({
      ...row.product,
      categoryName: row.categoryName,
      sortKey: row.sortKey as string | number,
    }));
  },

  async countList(db: DbOrTx, shopId: string, query: ProductListQuery): Promise<number> {
    const [row] = await db.select({ total: count() }).from(products).where(listConditions(shopId, query));
    return row?.total ?? 0;
  },

  /** Числа вкладок списка и баннера «N без фото». */
  async counts(db: DbOrTx, shopId: string): Promise<ProductCounts> {
    const [row] = await db
      .select({
        all: count(),
        noPhoto: sql<number>`count(*) filter (where ${hasNoPhoto()})`.mapWith(Number),
        outOfStock: sql<number>`count(*) filter (where ${products.totalStock} = 0)`.mapWith(Number),
        hidden: sql<number>`count(*) filter (where not ${products.isVisible})`.mapWith(Number),
      })
      .from(products)
      .where(eq(products.shopId, shopId));
    return {
      all: row?.all ?? 0,
      noPhoto: row?.noPhoto ?? 0,
      outOfStock: row?.outOfStock ?? 0,
      hidden: row?.hidden ?? 0,
    };
  },

  /** Числа для чек-листа магазина (раньше — в модуле магазина, T-404). */
  async readiness(db: DbOrTx, shopId: string): Promise<ReadinessCounts> {
    const [row] = await db
      .select({
        total: count(),
        visible: sql<number>`count(*) filter (where ${products.isVisible})`.mapWith(Number),
        withoutPhoto: sql<number>`count(*) filter (where ${hasNoPhoto()})`.mapWith(Number),
      })
      .from(products)
      .where(eq(products.shopId, shopId));
    return { total: row?.total ?? 0, visible: row?.visible ?? 0, withoutPhoto: row?.withoutPhoto ?? 0 };
  },

  async find(db: DbOrTx, shopId: string, productId: string): Promise<ProductRow | null> {
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.shopId, shopId)));
    return row ?? null;
  },

  /** Товар, заблокированный до конца транзакции: правки вариантов и фото одного товара идут по очереди. */
  async findForUpdate(db: DbOrTx, shopId: string, productId: string): Promise<ProductRow | null> {
    const [row] = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.shopId, shopId)))
      .for('update');
    return row ?? null;
  },

  async isShortIdTaken(db: DbOrTx, shopId: string, shortId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(eq(products.shopId, shopId), eq(products.shortId, shortId)))
      .limit(1);
    return row !== undefined;
  },

  async insert(
    db: DbOrTx,
    shopId: string,
    row: Omit<InferInsertModel<typeof products>, 'shopId' | 'id'>,
  ): Promise<ProductRow> {
    const [created] = await db
      .insert(products)
      .values({ ...row, shopId })
      .returning();
    return created!;
  },

  async update(
    db: DbOrTx,
    shopId: string,
    productId: string,
    patch: Partial<Pick<ProductRow, 'name' | 'slug' | 'description' | 'categoryId' | 'isVisible'>>,
  ): Promise<ProductRow | null> {
    const [row] = await db
      .update(products)
      .set(patch)
      .where(and(eq(products.id, productId), eq(products.shopId, shopId)))
      .returning();
    return row ?? null;
  },

  /** Отметить изменение (варианты, фото) — `updatedAt` товара. */
  async touch(db: DbOrTx, shopId: string, productId: string): Promise<void> {
    await db
      .update(products)
      .set({ updatedAt: new Date() })
      .where(and(eq(products.id, productId), eq(products.shopId, shopId)));
  },

  /** Удалить товар; варианты и фото — каскадом. */
  async delete(db: DbOrTx, shopId: string, productId: string): Promise<boolean> {
    const rows = await db
      .delete(products)
      .where(and(eq(products.id, productId), eq(products.shopId, shopId)))
      .returning({ id: products.id });
    return rows.length > 0;
  },

  /** Массово: показать или скрыть. Чужие и несуществующие id пропускаются; возвращает, сколько изменено. */
  async setVisibility(db: DbOrTx, shopId: string, productIds: string[], isVisible: boolean): Promise<number> {
    const rows = await db
      .update(products)
      .set({ isVisible })
      .where(and(eq(products.shopId, shopId), inArray(products.id, productIds)))
      .returning({ id: products.id });
    return rows.length;
  },

  async setCategory(db: DbOrTx, shopId: string, productIds: string[], categoryId: string | null): Promise<number> {
    const rows = await db
      .update(products)
      .set({ categoryId })
      .where(and(eq(products.shopId, shopId), inArray(products.id, productIds)))
      .returning({ id: products.id });
    return rows.length;
  },

  /**
   * «Цена от–до» и «всего на складе» из вариантов (решение основателя 2026-11-09, T-407: пересчёт в той же
   * транзакции, без триггера). Им же пользуется импорт (T-409).
   */
  async recalcTotals(db: DbOrTx, shopId: string, productId: string): Promise<void> {
    const own = sql`${variants.productId} = ${products.id}`;
    await db
      .update(products)
      .set({
        minPrice: sql`coalesce((select min(${variants.price}) from ${variants} where ${own}), 0)`,
        maxPrice: sql`coalesce((select max(${variants.price}) from ${variants} where ${own}), 0)`,
        totalStock: sql`coalesce((select sum(${variants.stock}) from ${variants} where ${own}), 0)`,
      })
      .where(and(eq(products.id, productId), eq(products.shopId, shopId)));
  },
};
