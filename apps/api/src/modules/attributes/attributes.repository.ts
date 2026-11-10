import { and, asc, count, eq, inArray, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { attributes, attributeValues, variantValues } from '../../core/db/schema/index.js';

export type AttributeRow = InferSelectModel<typeof attributes>;
export type AttributeValueRow = { id: string; attributeId: string; value: string; position: number };
export type ValueWithUsage = AttributeValueRow & { usageCount: number };

/** Свойства и их значения (FR-A6, D4). Все функции — по `shopId` (backend-structure.md, раздел 6). */
export const attributesRepository = {
  /** Правки свойств одного магазина — по очереди до конца транзакции (позиции, значения целиком, «Свой размер»). */
  async lock(db: DbOrTx, shopId: string): Promise<void> {
    await db.execute(sql`select pg_advisory_xact_lock(hashtextextended(${'attributes:' + shopId}, 0))`);
  },

  async list(db: DbOrTx, shopId: string): Promise<AttributeRow[]> {
    return db
      .select()
      .from(attributes)
      .where(eq(attributes.shopId, shopId))
      .orderBy(asc(attributes.position), asc(attributes.id));
  },

  async find(db: DbOrTx, shopId: string, attributeId: string): Promise<AttributeRow | null> {
    const [row] = await db
      .select()
      .from(attributes)
      .where(and(eq(attributes.id, attributeId), eq(attributes.shopId, shopId)));
    return row ?? null;
  },

  /** Какие из id — свойства этого магазина. */
  async existing(db: DbOrTx, shopId: string, attributeIds: string[]): Promise<string[]> {
    if (attributeIds.length === 0) return [];
    const rows = await db
      .select({ id: attributes.id })
      .from(attributes)
      .where(and(eq(attributes.shopId, shopId), inArray(attributes.id, attributeIds)));
    return rows.map((row) => row.id);
  },

  async count(db: DbOrTx, shopId: string): Promise<number> {
    const [row] = await db.select({ total: count() }).from(attributes).where(eq(attributes.shopId, shopId));
    return row?.total ?? 0;
  },

  async insert(
    db: DbOrTx,
    shopId: string,
    row: Pick<AttributeRow, 'name' | 'position' | 'inFilters'>,
  ): Promise<AttributeRow> {
    const [created] = await db
      .insert(attributes)
      .values({ ...row, shopId })
      .returning();
    return created!;
  },

  async update(
    db: DbOrTx,
    shopId: string,
    attributeId: string,
    patch: Partial<Pick<AttributeRow, 'name' | 'position' | 'inFilters'>>,
  ): Promise<void> {
    await db
      .update(attributes)
      .set(patch)
      .where(and(eq(attributes.id, attributeId), eq(attributes.shopId, shopId)));
  },

  /** Удалить свойство; значения и их отметки у вариантов — каскадом (контракт `deleteAttribute`). */
  async delete(db: DbOrTx, shopId: string, attributeId: string): Promise<boolean> {
    const rows = await db
      .delete(attributes)
      .where(and(eq(attributes.id, attributeId), eq(attributes.shopId, shopId)))
      .returning({ id: attributes.id });
    return rows.length > 0;
  },

  /** Значения свойств с числом вариантов, у которых они стоят (варианты только читаем). */
  async valuesWithUsage(db: DbOrTx, shopId: string, attributeIds?: string[]): Promise<ValueWithUsage[]> {
    if (attributeIds?.length === 0) return [];
    return db
      .select({
        id: attributeValues.id,
        attributeId: attributeValues.attributeId,
        value: attributeValues.value,
        position: attributeValues.position,
        // по индексу variant_values_value_idx — только значения этого магазина
        usageCount:
          sql<number>`(select count(*) from ${variantValues} where ${variantValues.attributeValueId} = ${attributeValues.id})`.mapWith(
            Number,
          ),
      })
      .from(attributeValues)
      .where(
        and(
          eq(attributeValues.shopId, shopId),
          attributeIds ? inArray(attributeValues.attributeId, attributeIds) : undefined,
        ),
      )
      .orderBy(asc(attributeValues.position), asc(attributeValues.id));
  },

  async values(db: DbOrTx, shopId: string, attributeIds: string[]): Promise<AttributeValueRow[]> {
    if (attributeIds.length === 0) return [];
    return db
      .select({
        id: attributeValues.id,
        attributeId: attributeValues.attributeId,
        value: attributeValues.value,
        position: attributeValues.position,
      })
      .from(attributeValues)
      .where(and(eq(attributeValues.shopId, shopId), inArray(attributeValues.attributeId, attributeIds)));
  },

  async insertValues(
    db: DbOrTx,
    shopId: string,
    rows: { attributeId: string; value: string; position: number }[],
  ): Promise<void> {
    // пачками: импорт может принести тысячи новых значений, а параметров в запросе — не больше 65 535
    for (let i = 0; i < rows.length; i += 1000) {
      await db.insert(attributeValues).values(rows.slice(i, i + 1000).map((row) => ({ ...row, shopId })));
    }
  },

  async updateValue(
    db: DbOrTx,
    shopId: string,
    valueId: string,
    patch: Partial<Pick<AttributeValueRow, 'value' | 'position'>>,
  ): Promise<void> {
    await db
      .update(attributeValues)
      .set(patch)
      .where(and(eq(attributeValues.id, valueId), eq(attributeValues.shopId, shopId)));
  },

  /**
   * Переименование — первый проход: значение временно `~<id>`. Уникальный индекс проверяется на каждой строке,
   * поэтому обмен двух значений («S» ↔ «M») без этого прохода падал бы.
   */
  async parkValues(db: DbOrTx, shopId: string, valueIds: string[]): Promise<void> {
    if (valueIds.length === 0) return;
    await db
      .update(attributeValues)
      .set({ value: sql`'~' || ${attributeValues.id}` })
      .where(and(eq(attributeValues.shopId, shopId), inArray(attributeValues.id, valueIds)));
  },

  async deleteValues(db: DbOrTx, shopId: string, valueIds: string[]): Promise<void> {
    if (valueIds.length === 0) return;
    await db
      .delete(attributeValues)
      .where(and(eq(attributeValues.shopId, shopId), inArray(attributeValues.id, valueIds)));
  },
};
