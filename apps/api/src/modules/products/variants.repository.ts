import { and, asc, eq, inArray, like, ne, notInArray, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { attributes, attributeValues, variants, variantValues } from '../../core/db/schema/index.js';

export type VariantRow = InferSelectModel<typeof variants>;
export type VariantValueRow = {
  variantId: string;
  attributeId: string;
  attributeName: string;
  valueId: string;
  value: string;
};
export type VariantFields = Pick<VariantRow, 'sku' | 'barcode' | 'price' | 'stock' | 'position'>;

/**
 * Варианты товаров и их значения свойств. Все функции — по `shopId`. Свойства и значения — область модуля
 * свойств (T-408): чтение и «Свой размер» (новое значение) переедут в его сервис, когда он появится.
 */
export const variantsRepository = {
  async listForProducts(db: DbOrTx, shopId: string, productIds: string[]): Promise<VariantRow[]> {
    if (productIds.length === 0) return [];
    return db
      .select()
      .from(variants)
      .where(and(eq(variants.shopId, shopId), inArray(variants.productId, productIds)))
      .orderBy(asc(variants.position), asc(variants.id));
  },

  /** Значения свойств вариантов — в порядке свойств магазина. */
  async valuesForVariants(db: DbOrTx, shopId: string, variantIds: string[]): Promise<VariantValueRow[]> {
    if (variantIds.length === 0) return [];
    return db
      .select({
        variantId: variantValues.variantId,
        attributeId: attributes.id,
        attributeName: attributes.name,
        valueId: attributeValues.id,
        value: attributeValues.value,
      })
      .from(variantValues)
      .innerJoin(attributeValues, eq(attributeValues.id, variantValues.attributeValueId))
      .innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
      .where(and(eq(attributeValues.shopId, shopId), inArray(variantValues.variantId, variantIds)))
      .orderBy(asc(attributes.position), asc(attributes.id));
  },

  /** Артикулы из списка, занятые вариантами других товаров магазина. */
  async skusTakenElsewhere(db: DbOrTx, shopId: string, productId: string | null, skus: string[]): Promise<string[]> {
    if (skus.length === 0) return [];
    const conditions = [eq(variants.shopId, shopId), inArray(variants.sku, skus)];
    if (productId) conditions.push(ne(variants.productId, productId));
    const rows = await db
      .select({ sku: variants.sku })
      .from(variants)
      .where(and(...conditions));
    return rows.map((row) => row.sku);
  },

  /** Артикулы магазина вида `<префикс>-…` — чтобы придуманный не совпал с существующим. */
  async skusWithPrefix(db: DbOrTx, shopId: string, prefix: string): Promise<string[]> {
    const rows = await db
      .select({ sku: variants.sku })
      .from(variants)
      .where(and(eq(variants.shopId, shopId), like(variants.sku, `${prefix.replace(/[\\%_]/g, '\\$&')}-%`)));
    return rows.map((row) => row.sku);
  },

  /** Удалить варианты товара, которых нет в `keepIds`. */
  async deleteExcept(db: DbOrTx, shopId: string, productId: string, keepIds: string[]): Promise<void> {
    const conditions = [eq(variants.shopId, shopId), eq(variants.productId, productId)];
    if (keepIds.length) conditions.push(notInArray(variants.id, keepIds));
    await db.delete(variants).where(and(...conditions));
  },

  /**
   * Временные артикулы перед обновлением: иначе обмен артикулами между двумя вариантами на миг нарушил бы
   * уникальность (`variants_sku_unique`).
   */
  async parkSkus(db: DbOrTx, shopId: string, variantIds: string[]): Promise<void> {
    if (variantIds.length === 0) return;
    await db
      .update(variants)
      .set({ sku: sql`'~' || ${variants.id}::text` })
      .where(and(eq(variants.shopId, shopId), inArray(variants.id, variantIds)));
  },

  async update(db: DbOrTx, shopId: string, variantId: string, fields: VariantFields): Promise<void> {
    await db
      .update(variants)
      .set(fields)
      .where(and(eq(variants.id, variantId), eq(variants.shopId, shopId)));
  },

  async insertMany(db: DbOrTx, shopId: string, productId: string, rows: VariantFields[]): Promise<string[]> {
    if (rows.length === 0) return [];
    const created = await db
      .insert(variants)
      .values(rows.map((row) => ({ ...row, shopId, productId })))
      .returning({ id: variants.id });
    return created.map((row) => row.id);
  },

  /** Значения свойств вариантов целиком: старые снимаются, новые ставятся. */
  async replaceValues(
    db: DbOrTx,
    variantIds: string[],
    pairs: { variantId: string; attributeValueId: string }[],
  ): Promise<void> {
    if (variantIds.length) await db.delete(variantValues).where(inArray(variantValues.variantId, variantIds));
    if (pairs.length) await db.insert(variantValues).values(pairs);
  },
};
