import { and, asc, desc, eq, inArray, sql } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { importErrors, importMappings, importRows, imports, type ColumnMapping } from '../../core/db/schema/index.js';
import type { Cursor } from '../../core/pagination/index.js';

export type ImportRecord = InferSelectModel<typeof imports>;
export type ImportStatus = ImportRecord['status'];
export type ImportErrorRecord = InferSelectModel<typeof importErrors>;
export type ImportRowRecord = InferSelectModel<typeof importRows>;
export type ImportListRow = ImportRecord & { sortKey: string };

type ImportPatch = Partial<Omit<ImportRecord, 'id' | 'shopId' | 'createdAt' | 'fileKey' | 'fileName'>>;

/** Строк в одном запросе: у PostgreSQL не больше 65 535 параметров на запрос. */
const CHUNK = 1000;

/** Импорт принадлежит магазину — условие для таблиц строк и ошибок, у которых своего `shop_id` нет. */
const ownImport = (shopId: string, importId: string) =>
  sql`exists (select 1 from ${imports} where ${imports.id} = ${importId} and ${imports.shopId} = ${shopId})`;

/** Импорты магазина (FR-A3). Все функции — по `shopId` (backend-structure.md, раздел 6). */
export const importsRepository = {
  /** Новый импорт в статусе `parsing`. Уже есть незаконченный — нарушение уникальности (частичный индекс). */
  async insert(db: DbOrTx, shopId: string, file: { fileKey: string; fileName: string }): Promise<ImportRecord> {
    const [row] = await db
      .insert(imports)
      .values({ ...file, shopId })
      .returning();
    return row!;
  },

  async find(db: DbOrTx, shopId: string, importId: string): Promise<ImportRecord | null> {
    const [row] = await db
      .select()
      .from(imports)
      .where(and(eq(imports.id, importId), eq(imports.shopId, shopId)));
    return row ?? null;
  },

  /** Импорт, заблокированный до конца транзакции: два применения одного импорта идут по очереди. */
  async findForUpdate(db: DbOrTx, shopId: string, importId: string): Promise<ImportRecord | null> {
    const [row] = await db
      .select()
      .from(imports)
      .where(and(eq(imports.id, importId), eq(imports.shopId, shopId)))
      .for('update');
    return row ?? null;
  },

  /** История: новые сверху; на одну строку больше — понять, есть ли дальше. Дата строкой — без потери микросекунд. */
  async list(db: DbOrTx, shopId: string, cursor: Cursor | null, limit: number): Promise<ImportListRow[]> {
    const where = [eq(imports.shopId, shopId)];
    if (cursor) {
      where.push(sql`(${imports.createdAt}, ${imports.id}) < (${String(cursor.key)}::timestamptz, ${cursor.id}::uuid)`);
    }
    const rows = await db
      .select({ record: imports, sortKey: sql<string>`${imports.createdAt}::text` })
      .from(imports)
      .where(and(...where))
      .orderBy(desc(imports.createdAt), desc(imports.id))
      .limit(limit + 1);
    return rows.map((row) => ({ ...row.record, sortKey: row.sortKey }));
  },

  /**
   * Сменить статус, только если он один из `from`: отмена и фоновые задачи не затирают друг друга. Не тот статус
   * (или чужой импорт) — `null`.
   */
  async transition(
    db: DbOrTx,
    shopId: string,
    importId: string,
    from: ImportStatus[],
    patch: ImportPatch,
  ): Promise<ImportRecord | null> {
    const [row] = await db
      .update(imports)
      .set(patch)
      .where(and(eq(imports.id, importId), eq(imports.shopId, shopId), inArray(imports.status, from)))
      .returning();
    return row ?? null;
  },

  // ───────── разобранные строки (между предпросмотром и применением) ─────────

  /** Только после проверки, что импорт свой (вызывается в транзакции со сменой его статуса). */
  async insertRows(db: DbOrTx, importId: string, rows: Omit<ImportRowRecord, 'importId'>[]): Promise<void> {
    for (let i = 0; i < rows.length; i += CHUNK) {
      await db.insert(importRows).values(rows.slice(i, i + CHUNK).map((row) => ({ ...row, importId })));
    }
  },

  async listRows(db: DbOrTx, shopId: string, importId: string): Promise<ImportRowRecord[]> {
    return db
      .select()
      .from(importRows)
      .where(and(eq(importRows.importId, importId), ownImport(shopId, importId)))
      .orderBy(asc(importRows.rowNumber));
  },

  async deleteRows(db: DbOrTx, shopId: string, importId: string): Promise<void> {
    await db.delete(importRows).where(and(eq(importRows.importId, importId), ownImport(shopId, importId)));
  },

  // ───────── ошибки по строкам ─────────

  /** Только после проверки, что импорт свой. */
  async insertErrors(db: DbOrTx, importId: string, rows: Omit<ImportErrorRecord, 'id' | 'importId'>[]): Promise<void> {
    for (let i = 0; i < rows.length; i += CHUNK) {
      await db.insert(importErrors).values(rows.slice(i, i + CHUNK).map((row) => ({ ...row, importId })));
    }
  },

  /** Страница ошибок по порядку строк файла. */
  async listErrors(
    db: DbOrTx,
    shopId: string,
    importId: string,
    cursor: Cursor | null,
    limit: number,
  ): Promise<ImportErrorRecord[]> {
    const where = [eq(importErrors.importId, importId), ownImport(shopId, importId)];
    if (cursor) {
      where.push(sql`(${importErrors.row}, ${importErrors.id}) > (${Number(cursor.key)}, ${cursor.id}::uuid)`);
    }
    return db
      .select()
      .from(importErrors)
      .where(and(...where))
      .orderBy(asc(importErrors.row), asc(importErrors.id))
      .limit(limit + 1);
  },

  async deleteErrors(db: DbOrTx, shopId: string, importId: string): Promise<void> {
    await db.delete(importErrors).where(and(eq(importErrors.importId, importId), ownImport(shopId, importId)));
  },

  // ───────── запомненные сопоставления ─────────

  async findMapping(db: DbOrTx, shopId: string, headersHash: string): Promise<ColumnMapping[] | null> {
    const [row] = await db
      .select({ mapping: importMappings.mapping })
      .from(importMappings)
      .where(and(eq(importMappings.shopId, shopId), eq(importMappings.headersHash, headersHash)));
    return row?.mapping ?? null;
  },

  async saveMapping(db: DbOrTx, shopId: string, headersHash: string, mapping: ColumnMapping[]): Promise<void> {
    await db
      .insert(importMappings)
      .values({ shopId, headersHash, mapping })
      .onConflictDoUpdate({
        target: [importMappings.shopId, importMappings.headersHash],
        set: { mapping, updatedAt: new Date() },
      });
  },
};
