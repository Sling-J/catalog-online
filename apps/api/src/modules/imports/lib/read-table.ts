// Файл запускается и как код потока чтения (`readTableIsolated`): в тестах Node сам снимает с него типы, поэтому
// здесь только стираемый TypeScript (без enum, namespace, свойств в параметрах конструктора) и без относительных
// импортов.
import { isMainThread, parentPort, Worker, workerData } from 'node:worker_threads';

import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

/** Не больше строк с данными в файле (FR-A3). */
export const MAX_ROWS = 20_000;
/** Колонок с заголовком читаем не больше — остальные отбрасываются. */
export const MAX_COLUMNS = 60;
/** Обязательных полей четыре (артикул, название, цена, остаток) — меньше колонок быть не может. */
const MIN_COLUMNS = 4;

/**
 * Почему файл не подошёл — `Import.failureCode`, текст показывает админка. `too_large` — чтение упёрлось в потолок
 * памяти или времени потока (огромная или «вредная» книга).
 */
export type ImportFailure = 'unreadable_file' | 'too_many_rows' | 'no_required_columns' | 'no_rows' | 'too_large';

export class ImportFileError extends Error {
  readonly code: ImportFailure;

  constructor(code: ImportFailure) {
    super(code);
    this.code = code;
  }
}

/** Строка данных: номер строки в файле (как в Excel, с единицы) и ячейки по порядку заголовков. */
export type TableRow = { number: number; cells: string[] };
export type Table = { headers: string[]; rows: TableRow[] };

type RawRow = { number: number; cells: string[] };

/**
 * Прочитать файл импорта: `.xlsx` (первый лист) или CSV (UTF-8, UTF-16 или Windows-1251; разделитель `;`, `,` или
 * табуляция). Формат определяется по содержимому, а не по имени. Заголовки — первая непустая строка; колонки без
 * заголовка и пустые строки отбрасываются. Не получилось — `ImportFileError`.
 */
export async function readTable(file: Buffer): Promise<Table> {
  const raw = isZip(file) ? await readXlsx(file) : readCsv(file);
  return toTable(raw);
}

const isZip = (file: Buffer) => file.length > 3 && file[0] === 0x50 && file[1] === 0x4b;

function toTable(raw: RawRow[]): Table {
  const clean = raw.map((row) => ({ number: row.number, cells: row.cells.map(cleanCell) }));
  const headerAt = clean.findIndex((row) => row.cells.some(Boolean));
  if (headerAt === -1) throw new ImportFileError('unreadable_file');

  const columns = clean[headerAt]!.cells.flatMap((header, at) => (header ? [{ header, at }] : [])).slice(
    0,
    MAX_COLUMNS,
  );
  if (columns.length < MIN_COLUMNS) throw new ImportFileError('no_required_columns');

  const rows: TableRow[] = [];
  for (const row of clean.slice(headerAt + 1)) {
    const cells = columns.map((column) => row.cells[column.at] ?? '');
    if (!cells.some(Boolean)) continue;
    if (rows.length === MAX_ROWS) throw new ImportFileError('too_many_rows');
    rows.push({ number: row.number, cells });
  }
  if (rows.length === 0) throw new ImportFileError('no_rows');
  return { headers: uniqueHeaders(columns.map((column) => column.header)), rows };
}

/** Пробелы по краям и подряд, неразрывные пробелы, переводы строк внутри ячейки — один пробел. */
const cleanCell = (value: string): string => value.replace(/[\s\u00a0\u202f]+/g, ' ').trim();

/** Сопоставление колонок идёт по заголовку, поэтому повторы получают номер: «Цена», «Цена (2)». */
function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header) => {
    const count = (seen.get(header.toLowerCase()) ?? 0) + 1;
    seen.set(header.toLowerCase(), count);
    return count === 1 ? header : `${header} (${count})`;
  });
}

// ───────── xlsx ─────────

/**
 * Первый лист книги. Книга загружается в память целиком: потоковое чтение ExcelJS 4.4 ненадёжно (теряет строки и
 * даты, если части архива лежат не в «экселевском» порядке, и ломается со второго файла в процессе —
 * `06-process/pitfalls.md`). Память ограничивает поток, в котором идёт чтение (`readTableIsolated`).
 */
async function readXlsx(file: Buffer): Promise<RawRow[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    // тип Buffer у ExcelJS старше, чем у Node 22
    await workbook.xlsx.load(file as unknown as ArrayBuffer, {
      ignoreNodes: ['dataValidations', 'conditionalFormatting'],
    });
  } catch {
    throw new ImportFileError('unreadable_file');
  }
  const sheet = workbook.worksheets[0];
  if (!sheet) throw new ImportFileError('unreadable_file');
  // запас на заголовок и пустые строки сверху; точная проверка — после отбрасывания пустых
  if (sheet.actualRowCount > MAX_ROWS + 100) throw new ImportFileError('too_many_rows');

  const rows: RawRow[] = [];
  sheet.eachRow((row, number) => {
    const cells: string[] = [];
    row.eachCell((cell, column) => {
      cells[column - 1] = cellText(cell.value);
    });
    // пропущенные ячейки — пустые строки, а не дыры в массиве
    rows.push({ number, cells: Array.from(cells, (cell) => cell ?? '') });
  });
  return rows;
}

/** Значение ячейки текстом: число — как в ячейке, формула — её результат, дата — `ГГГГ-ММ-ДД`. */
export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return numberText(value);
  if (typeof value === 'boolean') return String(value);
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? '' : value.toISOString().slice(0, 10);
  if ('richText' in value) return value.richText.map((part) => part.text).join('');
  if ('error' in value) return '';
  if ('result' in value) return cellText(value.result as ExcelJS.CellValue);
  if ('text' in value) return cellText(value.text as ExcelJS.CellValue);
  return '';
}

/** 18900.000000000004 → «18900»: хвост двоичной дроби из Excel не нужен ни цене, ни артикулу. */
const numberText = (value: number): string => (Number.isFinite(value) ? String(Number(value.toPrecision(15))) : '');

// ───────── csv ─────────

function readCsv(file: Buffer): RawRow[] {
  const text = decodeText(file);
  // двоичный файл (старый .xls, картинка) декодируется, но таблицей не является
  if (text.includes('\u0000')) throw new ImportFileError('unreadable_file');
  try {
    const records = parse(text, {
      delimiter: detectDelimiter(text),
      relax_column_count: true,
      relax_quotes: true,
      skip_empty_lines: true,
      info: true,
      // запас на заголовок; лишнее не разбираем
      to: MAX_ROWS + 100,
    }) as unknown as { record: string[]; info: { lines: number } }[];
    if (records.length >= MAX_ROWS + 100) throw new ImportFileError('too_many_rows');
    return records.map(({ record, info }) => ({ number: info.lines, cells: record }));
  } catch (error) {
    if (error instanceof ImportFileError) throw error;
    throw new ImportFileError('unreadable_file');
  }
}

/** UTF-16 (по метке порядка байтов), иначе UTF-8, а если байты не складываются в UTF-8 — Windows-1251. */
export function decodeText(file: Buffer): string {
  if (file[0] === 0xff && file[1] === 0xfe) return new TextDecoder('utf-16le').decode(file);
  if (file[0] === 0xfe && file[1] === 0xff) return new TextDecoder('utf-16be').decode(file);
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(file);
  } catch {
    return new TextDecoder('windows-1251').decode(file);
  }
}

// ───────── отдельный поток ─────────

/** Потолки потока чтения: 20 000 строк × 30 колонок читаются за ~2 с и укладываются в 256 МБ (замер 2026-11-10). */
export type ReadLimits = { memoryMb: number; timeoutMs: number };
export const READ_LIMITS: ReadLimits = { memoryMb: 512, timeoutMs: 60_000 };

const WORKER_KIND = 'catalog:read-table';

type WorkerReply = { ok: true; table: Table } | { ok: false; code: ImportFailure } | { ok: false; message: string };

/**
 * Прочитать файл в отдельном потоке Node (`worker_threads`) с потолком памяти и времени: огромная или «вредная»
 * книга (zip, который распаковывается в гигабайты) убивает только этот поток — API продолжает отвечать витрине и
 * админке, импорт получает `too_large` (решение основателя 2026-11-10). Поток запускает этот же файл: в сборке —
 * `.js`, в тестах — `.ts`, с которого Node снимает типы сам.
 */
export function readTableIsolated(file: Buffer, limits: ReadLimits = READ_LIMITS): Promise<Table> {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(import.meta.url), {
      workerData: { kind: WORKER_KIND, file },
      resourceLimits: { maxOldGenerationSizeMb: limits.memoryMb, maxYoungGenerationSizeMb: 32 },
      // вывод потока не нужен (предупреждения Node о снятии типов и т. п.)
      stdout: true,
      stderr: true,
    });
    let settled = false;
    const finish = (run: () => void) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      run();
      void worker.terminate();
    };
    const timer = setTimeout(() => finish(() => reject(new ImportFileError('too_large'))), limits.timeoutMs);
    worker.once('message', (reply: WorkerReply) =>
      finish(() => {
        if (reply.ok) resolve(reply.table);
        else if ('code' in reply) reject(new ImportFileError(reply.code));
        else reject(new Error(`Поток чтения файла: ${reply.message}`));
      }),
    );
    worker.once('error', (error: Error & { code?: string }) =>
      finish(() => reject(error.code === 'ERR_WORKER_OUT_OF_MEMORY' ? new ImportFileError('too_large') : error)),
    );
    worker.once('exit', (code) =>
      finish(() => reject(new Error(`Поток чтения файла завершился без ответа (код ${code})`))),
    );
  });
}

// код самого потока: запущен из `readTableIsolated` — читает файл и отвечает
if (!isMainThread && (workerData as { kind?: unknown } | null)?.kind === WORKER_KIND) {
  const data = workerData as { file: Uint8Array };
  const file = Buffer.from(data.file.buffer, data.file.byteOffset, data.file.byteLength);
  readTable(file).then(
    (table) => parentPort!.postMessage({ ok: true, table } satisfies WorkerReply),
    (error: unknown) =>
      parentPort!.postMessage(
        (error instanceof ImportFileError
          ? { ok: false, code: error.code }
          : { ok: false, message: String((error as Error)?.message ?? error) }) satisfies WorkerReply,
      ),
  );
}

/** Разделитель — кого больше в первой непустой строке вне кавычек; поровну или никого — `;` (так сохраняет Excel). */
export function detectDelimiter(text: string): string {
  const line = text.split(/\r\n|\n|\r/).find((candidate) => candidate.trim() !== '') ?? '';
  const counts = new Map([
    [';', 0],
    [',', 0],
    ['\t', 0],
  ]);
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (!quoted && counts.has(char)) counts.set(char, counts.get(char)! + 1);
  }
  let best = ';';
  for (const [delimiter, count] of counts) if (count > counts.get(best)!) best = delimiter;
  return best;
}
