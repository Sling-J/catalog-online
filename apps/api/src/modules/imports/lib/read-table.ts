import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

/** Не больше строк с данными в файле (FR-A3). */
export const MAX_ROWS = 20_000;
/** Колонок с заголовком читаем не больше — остальные отбрасываются. */
export const MAX_COLUMNS = 60;
/** Обязательных полей четыре (артикул, название, цена, остаток) — меньше колонок быть не может. */
const MIN_COLUMNS = 4;

/** Почему файл не подошёл — `Import.failureCode`, текст показывает админка. */
export type ImportFailure = 'unreadable_file' | 'too_many_rows' | 'no_required_columns' | 'no_rows';

export class ImportFileError extends Error {
  constructor(readonly code: ImportFailure) {
    super(code);
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

async function readXlsx(file: Buffer): Promise<RawRow[]> {
  const workbook = new ExcelJS.Workbook();
  try {
    // тип Buffer у ExcelJS старше, чем у Node 22
    await workbook.xlsx.load(file as unknown as ArrayBuffer);
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
