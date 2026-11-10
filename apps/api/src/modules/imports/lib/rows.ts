import type { ImportRow } from '../../products/product-import.service.js';
import type { CompleteMapping, Target } from './mapping.js';
import type { Table } from './read-table.js';

export type RowErrorCode =
  'sku_missing' | 'sku_duplicate' | 'name_missing' | 'price_invalid' | 'stock_invalid' | 'too_long';
export type RowError = { row: number; column: string | null; value: string | null; code: RowErrorCode };

/** Результат проверки строк: годные — в импорт, у остальных — по одной (первой) ошибке, такие строки пропускаются. */
export type ParsedRows = {
  rows: ImportRow[];
  errors: RowError[];
  /** Артикулы строк с ошибками: они в файле есть — «нет в файле» их не касается. */
  errorSkus: string[];
};

/** Длины — как у полей в контракте (`VariantInput`, `ProductCreate`, категории и значения свойств). */
const MAX = { sku: 64, barcode: 64, name: 200, description: 5000, groupKey: 200, category: 80, value: 60 };
/** `integer` в PostgreSQL. */
const INT_MAX = 2_147_483_647;
/** В ошибке значение ячейки показываем не целиком. */
const ERROR_VALUE_MAX = 200;

/**
 * Строки файла → строки импорта по сопоставлению колонок (FR-A3). Проверки: артикул есть и не повторяется в файле
 * (повтор — ошибка второй и следующих строк), название есть, цена и остаток — числа, длины полей.
 */
export function parseRows(table: Table, mapping: CompleteMapping): ParsedRows {
  const at = new Map(table.headers.map((header, i) => [header, i]));
  const single = new Map<Target, { column: string; at: number }>();
  const attributes: { name: string; column: string; at: number }[] = [];
  for (const item of mapping) {
    const index = at.get(item.column);
    if (index === undefined || item.target === 'skip') continue;
    if (item.target === 'attribute') attributes.push({ name: item.attributeName ?? item.column, column: item.column, at: index });
    else single.set(item.target, { column: item.column, at: index });
  } // prettier-ignore

  const result: ParsedRows = { rows: [], errors: [], errorSkus: [] };
  const seen = new Set<string>();
  for (const row of table.rows) {
    const cell = (target: Target) => {
      const column = single.get(target);
      return { column: column?.column ?? null, value: column ? (row.cells[column.at] ?? '') : '' };
    };
    const fail = (source: { column: string | null; value: string }, code: RowErrorCode, sku: string) => {
      result.errors.push({
        row: row.number,
        column: source.column,
        value: source.value ? source.value.slice(0, ERROR_VALUE_MAX) : null,
        code,
      });
      if (sku && code !== 'sku_duplicate') result.errorSkus.push(sku);
    };

    const sku = cell('sku');
    if (!sku.value) {
      fail(sku, 'sku_missing', '');
      continue;
    }
    if (sku.value.length > MAX.sku) {
      fail(sku, 'too_long', '');
      continue;
    }
    if (seen.has(sku.value)) {
      fail(sku, 'sku_duplicate', sku.value);
      continue;
    }
    seen.add(sku.value);

    const name = cell('name');
    if (!name.value) {
      fail(name, 'name_missing', sku.value);
      continue;
    }
    if (name.value.length > MAX.name) {
      fail(name, 'too_long', sku.value);
      continue;
    }
    const priceCell = cell('price');
    const price = parsePrice(priceCell.value);
    if (price === null) {
      fail(priceCell, 'price_invalid', sku.value);
      continue;
    }
    const stockCell = cell('stock');
    const stock = parseStock(stockCell.value);
    if (stock === null) {
      fail(stockCell, 'stock_invalid', sku.value);
      continue;
    }

    const groupKey = cell('group_key');
    const barcode = cell('barcode');
    const description = cell('description');
    const categoryCell = cell('category');
    const category = parseCategory(categoryCell.value);
    const values = attributes.map((attribute) => ({ ...attribute, value: row.cells[attribute.at] ?? '' }));
    const tooLong =
      (groupKey.value.length > MAX.groupKey && groupKey) ||
      (barcode.value.length > MAX.barcode && barcode) ||
      (description.value.length > MAX.description && description) ||
      (category?.some((part) => part.length > MAX.category) && categoryCell) ||
      values.find((item) => item.value.length > MAX.value);
    if (tooLong) {
      fail(tooLong, 'too_long', sku.value);
      continue;
    }

    result.rows.push({
      number: row.number,
      sku: sku.value,
      name: name.value,
      price,
      stock,
      groupKey: groupKey.value || null,
      barcode: barcode.value || null,
      category,
      description: description.value || null,
      attributes: values.flatMap((item) => (item.value ? [{ name: item.name, value: item.value }] : [])),
    });
  }
  return result;
}

const CURRENCY = /(₸|тг\.?|тенге|kzt|руб\.?|₽)$/i;

/**
 * Цена в целых тенге: «18900», «18 900,00», «18,900.50 ₸». Копейки округляются. Один разделитель с ровно тремя
 * цифрами после него («18,900») — разделитель тысяч: цен с тремя знаками после запятой не бывает. Не число,
 * отрицательное или пусто — `null`.
 */
export function parsePrice(text: string): number | null {
  let value = text.replace(/[\s'’]/g, '').replace(CURRENCY, '');
  if (!/^\d[\d.,]*$/.test(value)) return null;
  const lastComma = value.lastIndexOf(',');
  const lastDot = value.lastIndexOf('.');
  if (lastComma !== -1 && lastDot !== -1) {
    // оба знака: последний — десятичный, другой — тысячи
    const [decimal, thousands] = lastComma > lastDot ? [',', '.'] : ['.', ','];
    value = value.replaceAll(thousands, '').replace(decimal, '.');
  } else if (/^\d{1,3}([.,]\d{3})+$/.test(value)) {
    value = value.replace(/[.,]/g, '');
  } else {
    value = value.replace(',', '.');
  }
  if (!/^\d+(\.\d+)?$/.test(value)) return null;
  const price = Math.round(Number(value));
  return price <= INT_MAX ? price : null;
}

/**
 * Остаток — целое: «3», «3,000» (так пишет количество 1С), «12 шт». Дробный остаток округляется вниз, отрицательный
 * (пересорт в учёте) считается нулём: товара нет. Не число или пусто — `null`.
 */
export function parseStock(text: string): number | null {
  const value = text
    .replace(/\s/g, '')
    .replace(/шт\.?$/i, '')
    .replace(',', '.');
  if (!/^-?\d+(\.\d+)?$/.test(value)) return null;
  const stock = Math.max(0, Math.floor(Number(value)));
  return stock <= INT_MAX ? stock : null;
}

/** «Девочки / Куртки» → путь; уровней в каталоге два, поэтому от более глубокого пути берутся первые два. */
export function parseCategory(text: string): string[] | null {
  const parts = text
    .split('/')
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);
  return parts.length ? parts : null;
}
