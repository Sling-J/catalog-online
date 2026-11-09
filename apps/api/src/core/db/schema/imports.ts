// Импорт Excel/CSV (data-model.md, «Импорт»; контракт `Import`).
import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { at, createdAt, id, updatedAt } from './columns.js';
import { variants } from './catalog.js';
import { shops } from './shops.js';

/** Статусы — как в контракте (`ImportStatus`): parsing → mapping → previewing → previewed → applying → done. */
export const importStatus = pgEnum('import_status', [
  'parsing',
  'mapping',
  'previewing',
  'previewed',
  'applying',
  'done',
  'failed',
  'cancelled',
]);

export type ColumnMapping = {
  column: string;
  target:
    'sku' | 'name' | 'price' | 'stock' | 'group_key' | 'barcode' | 'category' | 'description' | 'attribute' | 'skip';
  attributeName?: string | null;
};
export type ImportPreview = { rows: number; create: number; update: number; errors: number; missingInFile: number };
export type ImportResult = { created: number; updated: number; zeroed: number; skipped: number };

/** История импортов. Пока импорт не закончен, у магазина он один (409 `import_in_progress`) — частичный индекс. */
export const imports = pgTable(
  'imports',
  {
    id: id(),
    shopId: uuid()
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    status: importStatus().notNull().default('parsing'),
    /** Исходный файл храним для истории. */
    fileKey: text().notNull(),
    fileName: text().notNull(),
    rowCount: integer(),
    headers: jsonb().$type<string[]>(),
    sampleRows: jsonb().$type<Record<string, string>[]>(),
    mapping: jsonb().$type<ColumnMapping[]>(),
    mappingRemembered: boolean().notNull().default(false),
    /** Обнулить остаток артикулов, которых нет в файле. */
    zeroMissing: boolean().notNull().default(false),
    preview: jsonb().$type<ImportPreview>(),
    result: jsonb().$type<ImportResult>(),
    /** Для failed: `unreadable_file`, `too_many_rows`, `no_required_columns`… */
    failureCode: text(),
    createdAt: createdAt(),
    finishedAt: at(),
  },
  (t) => [
    index('imports_shop_created_idx').on(t.shopId, t.createdAt),
    uniqueIndex('imports_one_active_per_shop')
      .on(t.shopId)
      .where(sql`${t.status} in ('parsing', 'mapping', 'previewing', 'previewed', 'applying')`),
  ],
);

export const importErrorCode = pgEnum('import_error_code', [
  'sku_missing',
  'sku_duplicate',
  'name_missing',
  'price_invalid',
  'stock_invalid',
  'too_long',
]);

/** Ошибки по строкам файла (контракт `ImportRowError`); строки с ошибками пропускаются. */
export const importErrors = pgTable(
  'import_errors',
  {
    id: id(),
    importId: uuid()
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    row: integer().notNull(),
    column: text(),
    value: text(),
    code: importErrorCode().notNull(),
  },
  (t) => [index('import_errors_import_idx').on(t.importId, t.row)],
);

/** Запомненные сопоставления колонок: файл с тем же набором заголовков проходит без шага «Колонки». */
export const importMappings = pgTable(
  'import_mappings',
  {
    shopId: uuid()
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    headersHash: text().notNull(),
    mapping: jsonb().$type<ColumnMapping[]>().notNull(),
    updatedAt: updatedAt(),
  },
  (t) => [primaryKey({ columns: [t.shopId, t.headersHash] })],
);

export const importRowAction = pgEnum('import_row_action', ['create', 'update', 'skip']);

/**
 * Разобранные строки файла между предпросмотром и применением (DM2). Применение — одной транзакцией;
 * после `done` / `failed` строки удаляются.
 */
export const importRows = pgTable(
  'import_rows',
  {
    importId: uuid()
      .notNull()
      .references(() => imports.id, { onDelete: 'cascade' }),
    rowNumber: integer().notNull(),
    data: jsonb().$type<Record<string, unknown>>().notNull(),
    action: importRowAction().notNull(),
    variantId: uuid().references(() => variants.id, { onDelete: 'set null' }),
  },
  (t) => [primaryKey({ columns: [t.importId, t.rowNumber] })],
);
