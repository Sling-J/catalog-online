import { and, asc, eq, gt, inArray, sql, type SQL } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { attributeValues, products, variants, variantValues, type ImportedField } from '../../core/db/schema/index.js';
import type { ShopIndex } from './lib/import-plan.js';

/** Строк в одном запросе: у PostgreSQL не больше 65 535 параметров на запрос. */
const CHUNK = 1000;

function chunks<T>(items: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += CHUNK) result.push(items.slice(i, i + CHUNK));
  return result;
}

/** `(values (…), (…)) as d(имена)` — таблица из параметров для массового `update … from`. */
const valuesTable = (rows: SQL[], columns: SQL): SQL => sql`(values ${sql.join(rows, sql`, `)}) as d(${columns})`;

export type NewProduct = {
  name: string;
  slug: string;
  shortId: string;
  description: string | null;
  categoryId: string | null;
  groupKey: string;
  importedFields: ImportedField[];
};
export type NewVariant = {
  productId: string;
  sku: string;
  barcode: string | null;
  price: number;
  stock: number;
  position: number;
};

/**
 * Массовые запросы применения импорта (FR-A3): до 20 000 строк одной транзакцией, поэтому всё — пачками, а не по
 * строке. Все функции — по `shopId` (backend-structure.md, раздел 6).
 */
export const productImportRepository = {
  /** Товары (от старых к новым) и варианты магазина — для плана импорта. */
  async loadIndex(db: DbOrTx, shopId: string): Promise<ShopIndex & { shortIds: string[] }> {
    const [productRows, variantRows] = await Promise.all([
      db
        .select({
          id: products.id,
          groupKey: products.groupKey,
          importedFields: products.importedFields,
          shortId: products.shortId,
        })
        .from(products)
        .where(eq(products.shopId, shopId))
        .orderBy(asc(products.createdAt), asc(products.id)),
      db
        .select({
          id: variants.id,
          sku: variants.sku,
          productId: variants.productId,
          stock: variants.stock,
          position: variants.position,
        })
        .from(variants)
        .where(eq(variants.shopId, shopId)),
    ]);
    return {
      products: productRows.map(({ shortId: _shortId, ...product }) => product),
      variants: variantRows,
      shortIds: productRows.map((product) => product.shortId),
    };
  },

  /** Новые товары; возвращает id по `shortId` (порядок строк `returning` не обещан). */
  async insertProducts(db: DbOrTx, shopId: string, rows: NewProduct[]): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    for (const chunk of chunks(rows)) {
      const created = await db
        .insert(products)
        .values(chunk.map((row) => ({ ...row, shopId })))
        .returning({ id: products.id, shortId: products.shortId });
      for (const row of created) ids.set(row.shortId, row.id);
    }
    return ids;
  },

  /** Новые варианты; возвращает id по артикулу. */
  async insertVariants(db: DbOrTx, shopId: string, rows: NewVariant[]): Promise<Map<string, string>> {
    const ids = new Map<string, string>();
    for (const chunk of chunks(rows)) {
      const created = await db
        .insert(variants)
        .values(chunk.map((row) => ({ ...row, shopId })))
        .returning({ id: variants.id, sku: variants.sku });
      for (const row of created) ids.set(row.sku, row.id);
    }
    return ids;
  },

  /** Цена и остаток вариантов; штрихкод — только если в файле он есть. */
  async updateVariants(
    db: DbOrTx,
    shopId: string,
    rows: { id: string; price: number; stock: number; barcode: string | null }[],
  ): Promise<void> {
    for (const chunk of chunks(rows)) {
      const data = valuesTable(
        chunk.map((row) => sql`(${row.id}::uuid, ${row.price}::integer, ${row.stock}::integer, ${row.barcode}::text)`),
        sql`id, price, stock, barcode`,
      );
      await db
        .update(variants)
        .set({
          price: sql`d.price`,
          stock: sql`d.stock`,
          barcode: sql`coalesce(d.barcode, ${variants.barcode})`,
        })
        .from(data)
        .where(and(eq(variants.shopId, shopId), sql`${variants.id} = d.id`));
    }
  },

  /** Снять с вариантов значения перечисленных свойств — перед тем как поставить значения из файла. */
  async clearValues(db: DbOrTx, shopId: string, pairs: { variantId: string; attributeId: string }[]): Promise<void> {
    for (const chunk of chunks(pairs)) {
      const data = sql.join(
        chunk.map((pair) => sql`(${pair.variantId}::uuid, ${pair.attributeId}::uuid)`),
        sql`, `,
      );
      await db.delete(variantValues).where(
        sql`(${variantValues.variantId}, ${variantValues.attributeValueId}) in (
          select d.variant_id, ${attributeValues.id}
          from (values ${data}) as d(variant_id, attribute_id)
          join ${attributeValues} on ${attributeValues.attributeId} = d.attribute_id
          where ${attributeValues.shopId} = ${shopId}
        )`,
      );
    }
  },

  async insertValues(db: DbOrTx, pairs: { variantId: string; attributeValueId: string }[]): Promise<void> {
    for (const chunk of chunks(pairs)) await db.insert(variantValues).values(chunk).onConflictDoNothing();
  },

  async renameProducts(db: DbOrTx, shopId: string, rows: { id: string; name: string; slug: string }[]): Promise<void> {
    for (const chunk of chunks(rows)) {
      const data = valuesTable(
        chunk.map((row) => sql`(${row.id}::uuid, ${row.name}::text, ${row.slug}::text)`),
        sql`id, name, slug`,
      );
      await db
        .update(products)
        .set({ name: sql`d.name`, slug: sql`d.slug` })
        .from(data)
        .where(and(eq(products.shopId, shopId), sql`${products.id} = d.id`));
    }
  },

  async setCategories(db: DbOrTx, shopId: string, rows: { id: string; categoryId: string }[]): Promise<void> {
    for (const chunk of chunks(rows)) {
      const data = valuesTable(
        chunk.map((row) => sql`(${row.id}::uuid, ${row.categoryId}::uuid)`),
        sql`id, category_id`,
      );
      await db
        .update(products)
        .set({ categoryId: sql`d.category_id` })
        .from(data)
        .where(and(eq(products.shopId, shopId), sql`${products.id} = d.id`));
    }
  },

  async setGroupKeys(db: DbOrTx, shopId: string, rows: { id: string; groupKey: string }[]): Promise<void> {
    for (const chunk of chunks(rows)) {
      const data = valuesTable(
        chunk.map((row) => sql`(${row.id}::uuid, ${row.groupKey}::text)`),
        sql`id, group_key`,
      );
      await db
        .update(products)
        .set({ groupKey: sql`d.group_key` })
        .from(data)
        .where(and(eq(products.shopId, shopId), sql`${products.id} = d.id`));
    }
  },

  /** Пометка «варианты из Excel»: с неё следующий импорт обнуляет остаток артикулов товара, которых нет в файле. */
  async markVariantsImported(db: DbOrTx, shopId: string, productIds: string[]): Promise<void> {
    for (const chunk of chunks(productIds)) {
      await db
        .update(products)
        .set({ importedFields: sql`array_append(${products.importedFields}, 'variants')` })
        .where(
          and(
            eq(products.shopId, shopId),
            inArray(products.id, chunk),
            sql`not ('variants' = any(${products.importedFields}))`,
          ),
        );
    }
  },

  /** Обнулить остаток; возвращает, сколько вариантов изменилось. */
  async zeroStock(db: DbOrTx, shopId: string, variantIds: string[]): Promise<number> {
    let zeroed = 0;
    for (const chunk of chunks(variantIds)) {
      const rows = await db
        .update(variants)
        .set({ stock: 0 })
        .where(and(eq(variants.shopId, shopId), inArray(variants.id, chunk), gt(variants.stock, 0)))
        .returning({ id: variants.id });
      zeroed += rows.length;
    }
    return zeroed;
  },

  /** «Цена от–до» и «всего на складе» товаров после импорта (как `productsRepository.recalcTotals`, но пачкой). */
  async recalcTotals(db: DbOrTx, shopId: string, productIds: string[]): Promise<void> {
    const own = sql`${variants.productId} = ${products.id}`;
    for (const chunk of chunks(productIds)) {
      await db
        .update(products)
        .set({
          minPrice: sql`coalesce((select min(${variants.price}) from ${variants} where ${own}), 0)`,
          maxPrice: sql`coalesce((select max(${variants.price}) from ${variants} where ${own}), 0)`,
          totalStock: sql`coalesce((select sum(${variants.stock}) from ${variants} where ${own}), 0)`,
        })
        .where(and(eq(products.shopId, shopId), inArray(products.id, chunk)));
    }
  },
};
