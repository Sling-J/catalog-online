import type {
  ColumnMapping,
  Import,
  ListImportErrorsData,
  ListImportErrorsResponse,
  ListImportsData,
  ListImportsResponse,
} from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import { InjectDb, isUniqueViolation, type Db } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { Jobs } from '../../core/jobs/index.js';
import { decodeCursor, encodeCursor } from '../../core/pagination/index.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { toImport, toRowError } from './imports.mapper.js';
import { importsRepository } from './imports.repository.js';
import { APPLY_IMPORT, PARSE_IMPORT, PREVIEW_IMPORT } from './lib/import-jobs.js';
import { completeMapping, headersHash, mappingErrors } from './lib/mapping.js';
import { buildTemplate } from './lib/template.js';

const DEFAULT_LIMIT = 30;
const HISTORY_SORT = 'new';
const ERRORS_SORT = 'row';

/**
 * Импорт Excel/CSV (FR-A3) — то, что делает человек: начать, выбрать колонки, применить, отменить, посмотреть
 * историю. Тяжёлое (чтение файла, проверка строк, запись в каталог) идёт в фоне — `ImportProcessingService`.
 *
 * Статусы: `parsing` → `mapping` (заголовки не узнали) → `previewing` → `previewed` → `applying` → `done`;
 * `failed` и `cancelled` — концы. Каждый переход — условный (`transition`): отмена и фоновая задача не затирают
 * друг друга. Незаконченный импорт у магазина один.
 */
@Injectable()
export class ImportsService {
  private template: Promise<Buffer> | null = null;

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly uploads: UploadsService,
    private readonly jobs: Jobs,
  ) {}

  async list(shopId: string, query: NonNullable<ListImportsData['query']>): Promise<ListImportsResponse> {
    const limit = query.limit ?? DEFAULT_LIMIT;
    const cursor = query.cursor ? decodeCursor(query.cursor, HISTORY_SORT) : null;
    const rows = await importsRepository.list(this.db, shopId, cursor, limit);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map(toImport),
      nextCursor:
        rows.length > limit && last ? encodeCursor({ sort: HISTORY_SORT, key: last.sortKey, id: last.id }) : null,
    };
  }

  /** Начать импорт загруженного файла; файл читается в фоне. Уже идёт другой — 409 `import_in_progress`. */
  async create(shopId: string, uploadId: string): Promise<Import> {
    try {
      return await this.db.transaction(async (tx) => {
        const upload = await this.uploads.consume(shopId, uploadId, 'import', tx);
        const row = await importsRepository.insert(tx, shopId, { fileKey: upload.key, fileName: upload.fileName });
        await this.jobs.send(PARSE_IMPORT, { shopId, importId: row.id }, tx);
        return toImport(row);
      });
    } catch (error) {
      if (isUniqueViolation(error)) throw new AppError('import_in_progress', 409);
      throw error;
    }
  }

  async get(shopId: string, importId: string): Promise<Import> {
    const row = await importsRepository.find(this.db, shopId, importId);
    if (!row) throw new AppError('not_found', 404);
    return toImport(row);
  }

  /** Отменить импорт, пока он не применяется: строки предпросмотра удаляются, запись остаётся в истории. */
  async cancel(shopId: string, importId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const cancelled = await importsRepository.transition(
        tx,
        shopId,
        importId,
        ['parsing', 'mapping', 'previewing', 'previewed'],
        { status: 'cancelled', finishedAt: new Date() },
      );
      if (!cancelled) await this.notReady(shopId, importId);
      await importsRepository.deleteRows(tx, shopId, importId);
    });
  }

  /**
   * Сопоставление колонок — с шага «Колонки» или заново с проверки («Изменить колонки»). Запоминается для файлов
   * с тем же набором заголовков и запускает предпросмотр.
   */
  async setMapping(shopId: string, importId: string, mapping: ColumnMapping[]): Promise<Import> {
    const row = await importsRepository.find(this.db, shopId, importId);
    if (!row) throw new AppError('not_found', 404);
    if (row.status !== 'mapping' && row.status !== 'previewed') throw new AppError('import_not_ready', 409);
    const headers = row.headers ?? [];
    const errors = mappingErrors(mapping, headers);
    if (errors.length) throw new AppError('validation_failed', 422, { errors });
    const complete = completeMapping(mapping, headers);

    return this.db.transaction(async (tx) => {
      const updated = await importsRepository.transition(tx, shopId, importId, ['mapping', 'previewed'], {
        status: 'previewing',
        mapping: complete,
        mappingRemembered: false,
        preview: null,
      });
      if (!updated) throw new AppError('import_not_ready', 409);
      await importsRepository.saveMapping(tx, shopId, headersHash(headers), complete);
      await importsRepository.deleteRows(tx, shopId, importId);
      await importsRepository.deleteErrors(tx, shopId, importId);
      await this.jobs.send(PREVIEW_IMPORT, { shopId, importId }, tx);
      return toImport(updated);
    });
  }

  async errors(
    shopId: string,
    importId: string,
    query: NonNullable<ListImportErrorsData['query']>,
  ): Promise<ListImportErrorsResponse> {
    if (!(await importsRepository.find(this.db, shopId, importId))) throw new AppError('not_found', 404);
    const limit = query.limit ?? DEFAULT_LIMIT;
    const cursor = query.cursor ? decodeCursor(query.cursor, ERRORS_SORT) : null;
    const rows = await importsRepository.listErrors(this.db, shopId, importId, cursor, limit);
    const page = rows.slice(0, limit);
    const last = page.at(-1);
    return {
      items: page.map(toRowError),
      nextCursor: rows.length > limit && last ? encodeCursor({ sort: ERRORS_SORT, key: last.row, id: last.id }) : null,
    };
  }

  /** Применить проверенный импорт: запись в каталог — в фоне, одной транзакцией. */
  async apply(shopId: string, importId: string, zeroMissing: boolean): Promise<Import> {
    return this.db.transaction(async (tx) => {
      const updated = await importsRepository.transition(tx, shopId, importId, ['previewed'], {
        status: 'applying',
        zeroMissing,
      });
      if (!updated) return this.notReady(shopId, importId);
      await this.jobs.send(APPLY_IMPORT, { shopId, importId }, tx);
      return toImport(updated);
    });
  }

  /** Шаблон один на всех — собираем при первом запросе. */
  downloadTemplate(): Promise<Buffer> {
    this.template ??= buildTemplate();
    return this.template;
  }

  /** Переход не случился: импорта нет (404) или он не в том статусе (409 `import_not_ready`). */
  private async notReady(shopId: string, importId: string): Promise<never> {
    if (!(await importsRepository.find(this.db, shopId, importId))) throw new AppError('not_found', 404);
    throw new AppError('import_not_ready', 409);
  }
}
