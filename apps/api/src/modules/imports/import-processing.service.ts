import { Injectable } from '@nestjs/common';

import { InjectDb, type Db } from '../../core/db/index.js';
import { Jobs, type JobAttempt } from '../../core/jobs/index.js';
import { Storage } from '../../core/storage/index.js';
import { ProductImportService, type ImportRow } from '../products/product-import.service.js';
import { importsRepository, type ImportRecord, type ImportStatus } from './imports.repository.js';
import { PREVIEW_IMPORT, SAMPLE_ROWS, type ImportJobData } from './lib/import-jobs.js';
import { completeMapping, headersHash, mappingErrors, suggestMapping } from './lib/mapping.js';
import { ImportFileError, readTable, type Table } from './lib/read-table.js';
import { parseRows } from './lib/rows.js';

/** Причина `failed`, когда дело не в файле: задача падала на всех попытках. */
const INTERNAL_FAILURE = 'internal_error';

/**
 * Фоновая часть импорта (FR-A3) — обработчики задач `imports.parse`, `imports.preview`, `imports.apply`.
 * Каждый шаг идемпотентен: сначала проверяет статус, результат пишет условным переходом — повтор задачи после
 * сбоя или отменённый импорт ничего не ломают (backend-structure.md, раздел 9). Ошибка файла — сразу `failed`
 * с причиной; любая другая — задача повторится, а на последней попытке импорт станет `failed`.
 */
@Injectable()
export class ImportProcessingService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly storage: Storage,
    private readonly jobs: Jobs,
    private readonly productImport: ProductImportService,
  ) {}

  /**
   * Прочитать файл. Заголовки как в шаблоне или знакомые по прошлому импорту — сразу к проверке строк; иначе —
   * шаг «Колонки» с предложенным сопоставлением.
   */
  parse({ shopId, importId }: ImportJobData, attempt: JobAttempt): Promise<void> {
    return this.step(shopId, importId, 'parsing', attempt, async (record) => {
      const table = await this.read(record);
      const suggested = suggestMapping(table.headers);
      const saved = await importsRepository.findMapping(this.db, shopId, headersHash(table.headers));
      // запомненное сопоставление берём, только если оно всё ещё подходит файлу
      const remembered = saved && mappingErrors(saved, table.headers).length === 0;
      const direct = remembered || suggested.templateLike;
      await this.db.transaction(async (tx) => {
        const updated = await importsRepository.transition(tx, shopId, importId, ['parsing'], {
          status: direct ? 'previewing' : 'mapping',
          headers: table.headers,
          rowCount: table.rows.length,
          sampleRows: table.rows
            .slice(0, SAMPLE_ROWS)
            .map((row) => Object.fromEntries(table.headers.map((header, i) => [header, row.cells[i] ?? '']))),
          mapping: remembered ? completeMapping(saved, table.headers) : suggested.mapping,
          mappingRemembered: Boolean(remembered),
        });
        if (updated && direct) await this.jobs.send(PREVIEW_IMPORT, { shopId, importId }, tx);
      });
    });
  }

  /** Проверить строки по сопоставлению: что создастся и обновится, ошибки по строкам. Каталог не меняется. */
  preview({ shopId, importId }: ImportJobData, attempt: JobAttempt): Promise<void> {
    return this.step(shopId, importId, 'previewing', attempt, async (record) => {
      const table = await this.read(record);
      const parsed = parseRows(table, completeMapping(record.mapping ?? [], table.headers));
      const plan = await this.productImport.preview(shopId, parsed.rows, parsed.errorSkus, this.db);
      const dataByRow = new Map(parsed.rows.map((row) => [row.number, row]));
      await this.db.transaction(async (tx) => {
        const updated = await importsRepository.transition(tx, shopId, importId, ['previewing'], {
          status: 'previewed',
          preview: {
            rows: table.rows.length,
            create: plan.create,
            update: plan.update,
            errors: parsed.errors.length,
            missingInFile: plan.missingInFile,
          },
        });
        if (!updated) return;
        // повтор задачи: прошлые строки и ошибки этого импорта — заново
        await importsRepository.deleteRows(tx, shopId, importId);
        await importsRepository.deleteErrors(tx, shopId, importId);
        await importsRepository.insertRows(tx, importId, [
          ...plan.actions.map((item) => ({
            rowNumber: item.row,
            data: toStored(dataByRow.get(item.row)!),
            action: item.action,
            variantId: item.variantId,
          })),
          // строки с ошибками пропускаются, но их артикулы в файле есть — «нет в файле» их не касается
          ...parsed.errorSkus.map((sku, i) => ({
            rowNumber: -1 - i,
            data: { sku },
            action: 'skip' as const,
            variantId: null,
          })),
        ]);
        await importsRepository.insertErrors(tx, importId, parsed.errors);
      });
    });
  }

  /**
   * Записать строки в каталог — одной транзакцией вместе со статусом `done` (DM2): упало посередине — каталог
   * не тронут, задача повторится. Импорт блокируется на время транзакции: вторая такая же задача дождётся и
   * увидит, что уже применено.
   */
  async apply({ shopId, importId }: ImportJobData, attempt: JobAttempt): Promise<void> {
    try {
      await this.db.transaction(async (tx) => {
        const record = await importsRepository.findForUpdate(tx, shopId, importId);
        if (record?.status !== 'applying') return;
        const stored = await importsRepository.listRows(tx, shopId, importId);
        const rows = stored.flatMap((row) => (row.action === 'skip' ? [] : [fromStored(row.rowNumber, row.data)]));
        const result = await this.productImport.apply(
          shopId,
          rows,
          {
            skusInFile: stored.flatMap((row) => (row.action === 'skip' ? [String(row.data.sku)] : [])),
            categoryMapped: record.mapping?.some((item) => item.target === 'category') ?? false,
            zeroMissing: record.zeroMissing,
          },
          tx,
        );
        await importsRepository.transition(tx, shopId, importId, ['applying'], {
          status: 'done',
          result: { ...result, skipped: record.preview?.errors ?? 0 },
          finishedAt: new Date(),
        });
        await importsRepository.deleteRows(tx, shopId, importId);
      });
    } catch (error) {
      if (attempt.last) await this.fail(shopId, importId, 'applying', INTERNAL_FAILURE);
      throw error;
    }
  }

  /** Общая обвязка шага: проверить статус, выполнить, разобрать ошибку. */
  private async step(
    shopId: string,
    importId: string,
    status: ImportStatus,
    attempt: JobAttempt,
    run: (record: ImportRecord) => Promise<void>,
  ): Promise<void> {
    const record = await importsRepository.find(this.db, shopId, importId);
    if (record?.status !== status) return;
    try {
      await run(record);
    } catch (error) {
      if (error instanceof ImportFileError) {
        await this.fail(shopId, importId, status, error.code);
        return;
      }
      if (attempt.last) await this.fail(shopId, importId, status, INTERNAL_FAILURE);
      throw error;
    }
  }

  private async read(record: ImportRecord): Promise<Table> {
    return readTable(await this.storage.get('private', record.fileKey));
  }

  private async fail(shopId: string, importId: string, from: ImportStatus, failureCode: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const failed = await importsRepository.transition(tx, shopId, importId, [from], {
        status: 'failed',
        failureCode,
        finishedAt: new Date(),
      });
      if (failed) await importsRepository.deleteRows(tx, shopId, importId);
    });
  }
}

/** Строка импорта в `import_rows.data` — без номера: он в `row_number`. */
function toStored({ number: _number, ...data }: ImportRow): Record<string, unknown> {
  return data;
}

function fromStored(number: number, data: Record<string, unknown>): ImportRow {
  return { ...(data as Omit<ImportRow, 'number'>), number };
}
