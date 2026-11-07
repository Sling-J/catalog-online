// Импорт на моках (T-309): файл не разбирается — сценарий выбирается по имени файла, а шаги идут по времени.
// - Имя с «1c» / «1с» / «vygruzka» / «выгрузка» — выгрузка из учётной программы: заголовки не как в шаблоне,
//   нужен шаг «Колонки» (как в макете AdminDesk, экран 3). Сопоставление запоминается: второй такой файл идёт сразу
//   к проверке с «колонки как в прошлый раз».
// - Имя с «bad» / «oshibka» / «ошибка» — файл не читается (`failed`, `unreadable_file`).
// - Любой другой — колонки как в шаблоне, сразу к проверке.
// Применение товары не меняет: на моках важны экраны, а не данные.
import type { ColumnMapping, Import, ImportRowError } from '../gen/types.gen.js';
import { buildXlsx } from './xlsx.js';

/** Сколько длится каждый фоновый шаг на моках — чтобы было видно «Читаем файл…», «Считаем…», «Загружаем…». */
export const IMPORT_STEP_MS = 1500;

export const TEMPLATE_HEADERS = [
  'Артикул',
  'Название',
  'Цена',
  'Остаток',
  'Код товара',
  'Штрихкод',
  'Категория',
  'Описание',
  'Рост',
  'Цвет',
];

const TEMPLATE_SAMPLE: Record<string, string>[] = [
  {
    Артикул: 'KD-110',
    Название: 'Куртка демисезонная',
    Цена: '18900',
    Остаток: '3',
    'Код товара': 'KD-1',
    Штрихкод: '4870001234110',
    Категория: 'Девочки / Куртки',
    Описание: '',
    Рост: '110',
    Цвет: 'розовый',
  },
];

const ONE_C_HEADERS = [
  'Код',
  'Номенклатура',
  'Цена розничная',
  'Количество',
  'Группа',
  'Размер',
  'Штрихкод',
  'Ед. изм.',
];

const ONE_C_SAMPLE: Record<string, string>[] = [
  {
    Код: 'KD-110',
    Номенклатура: 'Куртка демисезонная',
    'Цена розничная': '18900,00',
    Количество: '3',
    Группа: 'Детская / Куртки',
    Размер: '110',
    Штрихкод: '4870001234110',
    'Ед. изм.': 'шт',
  },
  {
    Код: 'KD-116',
    Номенклатура: 'Куртка демисезонная',
    'Цена розничная': '18900,00',
    Количество: '1',
    Группа: 'Детская / Куртки',
    Размер: '116',
    Штрихкод: '4870001234116',
    'Ед. изм.': 'шт',
  },
];

// Что API предложит само по заголовкам 1С: узнало не всё — артикул и цену человек выбирает сам. Когда выберет,
// экран совпадёт с макетом AdminDesk, экран 3.
const ONE_C_SUGGESTED: ColumnMapping[] = [
  { column: 'Код', target: 'skip' },
  { column: 'Номенклатура', target: 'name' },
  { column: 'Цена розничная', target: 'skip' },
  { column: 'Количество', target: 'stock' },
  { column: 'Группа', target: 'category' },
  { column: 'Размер', target: 'attribute', attributeName: 'Рост' },
  { column: 'Штрихкод', target: 'barcode' },
  { column: 'Ед. изм.', target: 'skip' },
];

const TEMPLATE_MAPPING: ColumnMapping[] = [
  { column: 'Артикул', target: 'sku' },
  { column: 'Название', target: 'name' },
  { column: 'Цена', target: 'price' },
  { column: 'Остаток', target: 'stock' },
  { column: 'Код товара', target: 'group_key' },
  { column: 'Штрихкод', target: 'barcode' },
  { column: 'Категория', target: 'category' },
  { column: 'Описание', target: 'description' },
  { column: 'Рост', target: 'attribute', attributeName: 'Рост' },
  { column: 'Цвет', target: 'attribute', attributeName: 'Цвет' },
];

type Scenario = 'template' | 'one_c' | 'unreadable';

const scenarioOf = (fileName: string): Scenario => {
  const name = fileName.toLowerCase();
  if (/bad|oshibka|ошибка/.test(name)) return 'unreadable';
  if (/1c|1с|vygruzka|выгрузка/.test(name)) return 'one_c';
  return 'template';
};

const PREVIEW: Record<Exclude<Scenario, 'unreadable'>, NonNullable<Import['preview']>> = {
  one_c: { rows: 218, create: 12, update: 203, errors: 3, missingInFile: 4 },
  template: { rows: 156, create: 4, update: 152, errors: 0, missingInFile: 7 },
};

const ONE_C_ERRORS: ImportRowError[] = [
  { row: 45, column: 'Цена розничная', value: '12 5OO', code: 'price_invalid' },
  { row: 102, column: 'Код', value: null, code: 'sku_missing' },
  { row: 160, column: 'Код', value: 'KD-118', code: 'sku_duplicate' },
];

/** Обязательные поля (FR-A3): без них импорт не начать. */
export const REQUIRED_TARGETS = ['sku', 'name', 'price', 'stock'] as const;
// эти поля — по одной колонке; свойств и «не загружать» может быть сколько угодно
const SINGLE_TARGETS = new Set<string>([...REQUIRED_TARGETS, 'group_key', 'barcode', 'category', 'description']);

/** Ошибка сопоставления: не хватает обязательного поля или одно поле выбрано дважды. */
export function mappingProblem(mapping: ColumnMapping[]): 'missing_required' | 'duplicate_target' | null {
  const targets = mapping.map((item) => item.target);
  if (REQUIRED_TARGETS.some((target) => !targets.includes(target))) return 'missing_required';
  const singles = targets.filter((target) => SINGLE_TARGETS.has(target));
  if (new Set(singles).size !== singles.length) return 'duplicate_target';
  return null;
}

/** Импорт на моках: что видно в API плюс когда закончится текущий фоновый шаг. */
type MockImport = Import & { scenario: Scenario; readyAt: number; zeroMissing?: boolean };

/** Шаблон Excel (FR-A3): заголовки и пример строки. */
export const importTemplateXlsx = (): Uint8Array =>
  buildXlsx('Товары', [
    TEMPLATE_HEADERS,
    ...TEMPLATE_SAMPLE.map((row) => TEMPLATE_HEADERS.map((header) => row[header] ?? '')),
  ]);

/** Прошлые импорты демо-магазина — для «Истории импортов». */
const demoHistory = (): MockImport[] => [
  {
    id: '0192d000-0000-7000-8000-0000000c0002',
    status: 'done',
    fileName: 'ostatki_24-10.xlsx',
    scenario: 'template',
    readyAt: 0,
    rowCount: 214,
    mappingRemembered: true,
    preview: { rows: 214, create: 2, update: 210, errors: 2, missingInFile: 3 },
    result: { created: 2, updated: 210, zeroed: 3, skipped: 2 },
    createdAt: '2026-10-24T10:12:00Z',
    finishedAt: '2026-10-24T10:13:00Z',
  },
  {
    id: '0192d000-0000-7000-8000-0000000c0001',
    status: 'done',
    fileName: 'vygruzka_1c_20-10.xlsx',
    scenario: 'one_c',
    readyAt: 0,
    rowCount: 212,
    mappingRemembered: false,
    preview: { rows: 212, create: 212, update: 0, errors: 0, missingInFile: 0 },
    result: { created: 212, updated: 0, zeroed: 0, skipped: 0 },
    createdAt: '2026-10-20T08:40:00Z',
    finishedAt: '2026-10-20T08:42:00Z',
  },
];

const ACTIVE = new Set<Import['status']>(['parsing', 'mapping', 'previewing', 'previewed', 'applying']);

/** Состояние импортов одного магазина на моках. */
export function createImportStore(withHistory: boolean) {
  const imports: MockImport[] = withHistory ? demoHistory() : [];
  // сопоставления, выбранные для набора заголовков (import_mappings)
  const remembered = new Map<string, ColumnMapping[]>();
  const headersKey = (headers: string[]) => headers.join('\u0001');

  const toPreview = (item: MockImport, now: number) => {
    item.status = 'previewing';
    item.readyAt = now + IMPORT_STEP_MS;
  };

  /** Фоновые шаги завершаются, когда прошло их время. */
  const advance = (item: MockImport, now: number): MockImport => {
    if (now < item.readyAt) return item;
    if (item.status === 'parsing') {
      if (item.scenario === 'unreadable') {
        item.status = 'failed';
        item.failureCode = 'unreadable_file';
        item.finishedAt = new Date(now).toISOString();
        return item;
      }
      const oneC = item.scenario === 'one_c';
      item.rowCount = PREVIEW[item.scenario].rows;
      item.headers = oneC ? ONE_C_HEADERS : TEMPLATE_HEADERS;
      item.sampleRows = oneC ? ONE_C_SAMPLE : TEMPLATE_SAMPLE;
      const saved = remembered.get(headersKey(item.headers));
      // следующий шаг считается от конца чтения, а не от запроса
      if (!oneC) {
        item.mapping = TEMPLATE_MAPPING;
        toPreview(item, item.readyAt);
      } else if (saved) {
        item.mapping = saved;
        item.mappingRemembered = true;
        toPreview(item, item.readyAt);
      } else {
        item.mapping = ONE_C_SUGGESTED;
        item.status = 'mapping';
      }
      return advance(item, now);
    }
    if (item.status === 'previewing') {
      item.status = 'previewed';
      item.preview = PREVIEW[item.scenario === 'one_c' ? 'one_c' : 'template'];
    } else if (item.status === 'applying') {
      const preview = item.preview!;
      item.status = 'done';
      item.result = {
        created: preview.create,
        updated: preview.update,
        zeroed: item.zeroMissing ? preview.missingInFile : 0,
        skipped: preview.errors,
      };
      item.finishedAt = new Date(now).toISOString();
    }
    return item;
  };

  const publicOf = (item: MockImport): Import => {
    const { scenario: _scenario, readyAt: _readyAt, zeroMissing: _zeroMissing, ...rest } = item;
    return rest;
  };
  const find = (id: unknown, now: number) => {
    const item = imports.find((entry) => entry.id === id);
    return item && advance(item, now);
  };

  return {
    list: (now = Date.now()): Import[] => imports.map((item) => publicOf(advance(item, now))),
    get: (id: unknown, now = Date.now()): Import | undefined => {
      const item = find(id, now);
      return item && publicOf(item);
    },
    /** Новый импорт; `null` — уже идёт другой (409 `import_in_progress`). */
    create: (fileName: string, now = Date.now()): Import | null => {
      if (imports.some((item) => ACTIVE.has(advance(item, now).status))) return null;
      const item: MockImport = {
        id: crypto.randomUUID(),
        status: 'parsing',
        fileName,
        scenario: scenarioOf(fileName),
        readyAt: now + IMPORT_STEP_MS,
        rowCount: null,
        headers: null,
        sampleRows: null,
        mapping: null,
        mappingRemembered: false,
        preview: null,
        result: null,
        failureCode: null,
        createdAt: new Date(now).toISOString(),
        finishedAt: null,
      };
      imports.unshift(item);
      return publicOf(item);
    },
    /** Сопоставление колонок: можно на шаге «Колонки» и заново с проверки. */
    setMapping: (id: unknown, mapping: ColumnMapping[], now = Date.now()): Import | 'not_found' | 'conflict' => {
      const item = find(id, now);
      if (!item) return 'not_found';
      if (item.status !== 'mapping' && item.status !== 'previewed') return 'conflict';
      item.mapping = mapping;
      item.preview = null;
      remembered.set(headersKey(item.headers ?? []), mapping);
      toPreview(item, now);
      return publicOf(item);
    },
    errors: (id: unknown, now = Date.now()): ImportRowError[] | undefined => {
      const item = find(id, now);
      if (!item) return undefined;
      return item.scenario === 'one_c' && item.preview ? ONE_C_ERRORS : [];
    },
    apply: (id: unknown, zeroMissing: boolean, now = Date.now()): Import | 'not_found' | 'conflict' => {
      const item = find(id, now);
      if (!item) return 'not_found';
      if (item.status !== 'previewed') return 'conflict';
      item.status = 'applying';
      item.zeroMissing = zeroMissing;
      item.readyAt = now + IMPORT_STEP_MS;
      return publicOf(item);
    },
    cancel: (id: unknown, now = Date.now()): 'ok' | 'not_found' | 'conflict' => {
      const item = find(id, now);
      if (!item) return 'not_found';
      if (item.status === 'applying' || item.status === 'done') return 'conflict';
      item.status = 'cancelled';
      item.finishedAt = new Date(now).toISOString();
      return 'ok';
    },
  };
}
