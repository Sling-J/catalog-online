import { and, count, eq, inArray, isNull, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { categories, products } from '../../core/db/schema/index.js';
import type { CategoryNode } from './lib/tree.js';

export type CategoryRow = InferSelectModel<typeof categories>;

/** Категории магазина (FR-A6). Все функции — по `shopId` (backend-structure.md, раздел 6). */
export const categoriesRepository = {
  /**
   * Правки категорий одного магазина — по очереди до конца транзакции (позиции «в конец», порядок целиком).
   * Блокировка по ключу магазина: строк может ещё не быть.
   */
  async lock(db: DbOrTx, shopId: string): Promise<void> {
    await db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'categories:' + shopId}, 0))`);
  },

  /** Все категории с числом их собственных товаров (товары только читаем — область модуля товаров). */
  async listWithCounts(db: DbOrTx, shopId: string): Promise<CategoryNode[]> {
    const productCount = db
      .select({ categoryId: products.categoryId, total: count().as('total') })
      .from(products)
      .where(eq(products.shopId, shopId))
      .groupBy(products.categoryId)
      .as('product_count');
    return db
      .select({
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        position: categories.position,
        productCount: sql<number>`coalesce(${productCount.total}, 0)`.mapWith(Number),
      })
      .from(categories)
      .leftJoin(productCount, eq(productCount.categoryId, categories.id))
      .where(eq(categories.shopId, shopId));
  },

  async list(db: DbOrTx, shopId: string): Promise<CategoryRow[]> {
    return db.select().from(categories).where(eq(categories.shopId, shopId));
  },

  async find(db: DbOrTx, shopId: string, categoryId: string): Promise<CategoryRow | null> {
    const [row] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.shopId, shopId)));
    return row ?? null;
  },

  async countSiblings(db: DbOrTx, shopId: string, parentId: string | null): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(categories)
      .where(
        and(
          eq(categories.shopId, shopId),
          parentId === null ? isNull(categories.parentId) : eq(categories.parentId, parentId),
        ),
      );
    return row?.total ?? 0;
  },

  async hasChildren(db: DbOrTx, shopId: string, categoryId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.shopId, shopId), eq(categories.parentId, categoryId)))
      .limit(1);
    return row !== undefined;
  },

  async insert(
    db: DbOrTx,
    shopId: string,
    row: Pick<CategoryRow, 'name' | 'parentId' | 'path' | 'position'>,
  ): Promise<CategoryRow> {
    const [created] = await db
      .insert(categories)
      .values({ ...row, shopId })
      .returning();
    return created!;
  },

  async update(
    db: DbOrTx,
    shopId: string,
    categoryId: string,
    patch: Partial<Pick<CategoryRow, 'name' | 'parentId' | 'path' | 'position'>>,
  ): Promise<void> {
    await db
      .update(categories)
      .set(patch)
      .where(and(eq(categories.id, categoryId), eq(categories.shopId, shopId)));
  },

  /**
   * Перенос между родителями — первый проход: родителем ставится сама категория. Уникальный индекс имён проверяется
   * на каждой строке, а не в конце запроса, поэтому обмен местами двух одноимённых категорий без этого прохода падал бы.
   */
  async parkParents(db: DbOrTx, shopId: string, categoryIds: string[]): Promise<void> {
    if (categoryIds.length === 0) return;
    await db
      .update(categories)
      .set({ parentId: sql`${categories.id}` })
      .where(and(eq(categories.shopId, shopId), inArray(categories.id, categoryIds)));
  },

  async delete(db: DbOrTx, shopId: string, categoryId: string): Promise<boolean> {
    const rows = await db
      .delete(categories)
      .where(and(eq(categories.id, categoryId), eq(categories.shopId, shopId)))
      .returning({ id: categories.id });
    return rows.length > 0;
  },
};
