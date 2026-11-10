import { createHash } from 'node:crypto';

import type { FieldError } from '../../../core/errors/index.js';
import type { ColumnMapping } from '../../../core/db/schema/index.js';

export type Target = ColumnMapping['target'];
/** Сопоставление после проверки: все колонки файла по порядку, `attributeName` заполнен только у свойств. */
export type CompleteMapping = { column: string; target: Target; attributeName: string | null }[];

/** Обязательные поля (FR-A3): без них импорт не начать. */
export const REQUIRED_TARGETS = ['sku', 'name', 'price', 'stock'] as const;
/** Эти поля — по одной колонке; свойств и «не загружать» может быть сколько угодно. */
const SINGLE_TARGETS: Target[] = [...REQUIRED_TARGETS, 'group_key', 'barcode', 'category', 'description'];

/** Имя свойства — как в `POST /attributes`. */
export const ATTRIBUTE_NAME_MAX = 60;

/** Заголовки шаблона (FR-A3) и пример строки. Колонки после «Описания» — свойства, их может быть сколько угодно. */
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
export const TEMPLATE_SAMPLE = [
  'KD-110',
  'Куртка демисезонная',
  '18900',
  '3',
  'KD-1',
  '4870001234110',
  'Девочки / Куртки',
  '',
  '110',
  'розовый',
];

/** Заголовок для сравнения: без регистра, «ё» как «е», знаки препинания — пробелы. */
export const normalizeHeader = (header: string): string =>
  header
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replace(/[^a-zа-яәғқңөұүһі0-9№]+/g, ' ')
    .trim();

/** Как колонка называется в шаблоне. */
const TEMPLATE_NAMES: Record<string, Target> = {
  артикул: 'sku',
  название: 'name',
  цена: 'price',
  остаток: 'stock',
  'код товара': 'group_key',
  штрихкод: 'barcode',
  категория: 'category',
  описание: 'description',
};

/** Как её называют учётные программы и люди — для подсказки на шаге «Колонки». Порядок — от точного к общему. */
const SYNONYMS: Record<Exclude<Target, 'attribute' | 'skip'>, string[]> = {
  sku: ['артикул товара', 'арт', 'sku', 'код номенклатуры', 'код'],
  name: ['наименование', 'наименование товара', 'название товара', 'номенклатура', 'товар', 'name'],
  price: ['цена розничная', 'розничная цена', 'цена продажи', 'розница', 'цена тг', 'цена ₸', 'price'],
  stock: ['остатки', 'количество', 'кол во', 'остаток на складе', 'свободный остаток', 'в наличии', 'наличие', 'qty', 'stock'],
  group_key: ['код модели', 'модель', 'родитель'],
  barcode: ['штрих код', 'штрихкод товара', 'шк', 'ean', 'ean13', 'barcode'],
  category: ['категория товара', 'группа товаров', 'группа', 'раздел'],
  description: ['описание товара'],
}; // prettier-ignore

/** Колонки учётных программ, которые каталогу не нужны, — по умолчанию «не загружать», а не свойство. */
const SKIPPED = new Set([
  '№', 'n', 'no', 'пп', 'п п', 'номер', '№ п п', 'ед', 'ед изм', 'единица', 'единица измерения', 'валюта', 'ндс',
  'сумма', 'склад', 'цена закупочная', 'закупочная цена', 'себестоимость',
]); // prettier-ignore

/**
 * Сопоставление, которое API предлагает само. `templateLike` — четыре обязательные колонки названы как в шаблоне:
 * такой файл идёт сразу к проверке, без шага «Колонки» (FR-A3). Остальные колонки шаблонного файла — свойства;
 * в чужом файле (выгрузка из учётной программы) узнаём, что можем, по синонимам, а человек поправит.
 */
export function suggestMapping(headers: string[]): { mapping: CompleteMapping; templateLike: boolean } {
  const normalized = headers.map(normalizeHeader);
  const targetAt = new Map<number, Target>();
  const taken = new Set<Target>();
  const assign = (names: string[], target: Target) => {
    if (taken.has(target)) return;
    for (const name of names) {
      const at = normalized.findIndex((header, i) => header === name && !targetAt.has(i));
      if (at === -1) continue;
      targetAt.set(at, target);
      taken.add(target);
      return;
    }
  };
  for (const [name, target] of Object.entries(TEMPLATE_NAMES)) assign([name], target);
  const templateLike = REQUIRED_TARGETS.every((target) => taken.has(target));
  for (const [target, names] of Object.entries(SYNONYMS)) assign(names, target as Target);

  const known = new Set([...Object.keys(TEMPLATE_NAMES), ...Object.values(SYNONYMS).flat()]);
  const mapping = headers.map((column, i) => {
    const target = targetAt.get(i);
    if (target) return { column, target, attributeName: null };
    // «Цена закупочная» рядом с «Ценой»: поле уже занято — вторую колонку не грузим, свойством она не станет
    if (SKIPPED.has(normalized[i]!) || known.has(normalized[i]!)) {
      return { column, target: 'skip' as const, attributeName: null };
    }
    return { column, target: 'attribute' as const, attributeName: column.slice(0, ATTRIBUTE_NAME_MAX) };
  });
  return { mapping, templateLike };
}

/**
 * Ошибки сопоставления (`PUT …/mapping`): не хватает обязательного поля или одно поле выбрано дважды — по полю
 * `mapping`, как в моках; чужая или повторная колонка и имя свойства — по своей строке.
 */
export function mappingErrors(mapping: ColumnMapping[], headers: string[]): FieldError[] {
  const errors: FieldError[] = [];
  const known = new Set(headers);
  const columns = new Set<string>();
  const attributeNames = new Set<string>();
  mapping.forEach((item, i) => {
    if (!known.has(item.column)) errors.push({ field: `mapping.${i}.column`, code: 'not_found' });
    else if (columns.has(item.column)) errors.push({ field: `mapping.${i}.column`, code: 'duplicate' });
    columns.add(item.column);
    if (item.target !== 'attribute') return;
    const name = attributeNameOf(item);
    if (name.length > ATTRIBUTE_NAME_MAX) errors.push({ field: `mapping.${i}.attributeName`, code: 'too_long' });
    if (attributeNames.has(name.toLowerCase())) {
      errors.push({ field: `mapping.${i}.attributeName`, code: 'duplicate' });
    }
    attributeNames.add(name.toLowerCase());
  });
  const targets = mapping.map((item) => item.target);
  if (REQUIRED_TARGETS.some((target) => !targets.includes(target))) {
    errors.push({ field: 'mapping', code: 'missing_required' });
  }
  const singles = targets.filter((target) => SINGLE_TARGETS.includes(target));
  if (new Set(singles).size !== singles.length) errors.push({ field: 'mapping', code: 'duplicate_target' });
  return errors;
}

/** Имя свойства колонки: выбранное, а если пусто — её заголовок. */
const attributeNameOf = (item: ColumnMapping): string => item.attributeName?.trim() || item.column.trim();

/** Привести сопоставление к полному виду: колонки по порядку файла, не упомянутые — «не загружать». */
export function completeMapping(mapping: ColumnMapping[], headers: string[]): CompleteMapping {
  const byColumn = new Map(mapping.map((item) => [item.column, item]));
  return headers.map((column) => {
    const item = byColumn.get(column);
    if (!item) return { column, target: 'skip', attributeName: null };
    return {
      column,
      target: item.target,
      attributeName: item.target === 'attribute' ? attributeNameOf(item) : null,
    };
  });
}

/** Ключ запомненного сопоставления: набор заголовков файла, порядок колонок не важен (data-model.md). */
export function headersHash(headers: string[]): string {
  return createHash('sha256')
    .update(JSON.stringify([...headers].sort()))
    .digest('hex');
}
