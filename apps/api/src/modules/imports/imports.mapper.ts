import type { Import, ImportRowError } from '@catalog/contract';

import type { ImportErrorRecord, ImportRecord } from './imports.repository.js';

/** Строка базы → `Import` контракта. */
export function toImport(row: ImportRecord): Import {
  return {
    id: row.id,
    status: row.status,
    fileName: row.fileName,
    rowCount: row.rowCount,
    headers: row.headers,
    sampleRows: row.sampleRows,
    mapping:
      row.mapping?.map((item) => ({
        column: item.column,
        target: item.target,
        attributeName: item.attributeName ?? null,
      })) ?? null,
    mappingRemembered: row.mappingRemembered,
    preview: row.preview,
    result: row.result,
    failureCode: row.failureCode,
    createdAt: row.createdAt.toISOString(),
    finishedAt: row.finishedAt?.toISOString() ?? null,
  };
}

export function toRowError(row: ImportErrorRecord): ImportRowError {
  return { row: row.row, column: row.column, value: row.value, code: row.code };
}
