import { AppError } from '../errors/index.js';

export type CursorValue = string | number;

/**
 * Курсор списков (API3): закладка «после этой строки» — значение сортировки и id последней показанной строки
 * (решение основателя 2026-11-09, T-407). Снаружи — непрозрачная строка base64url.
 */
export type Cursor<K extends CursorValue | CursorValue[] = CursorValue> = {
  /** Порядок, для которого выдан курсор: с другим порядком курсор недействителен. */
  sort: string;
  /**
   * Значение сортировки последней строки (дата — строкой из базы, без потери микросекунд). Несколько ключей
   * порядка — массивом (витрина: «закончился» и цена, T-410).
   */
  key: K;
  id: string;
};

const isValue = (value: unknown): value is CursorValue => typeof value === 'string' || typeof value === 'number';

export function encodeCursor(cursor: Cursor<CursorValue | CursorValue[]>): string {
  return Buffer.from(JSON.stringify([cursor.sort, cursor.key, cursor.id])).toString('base64url');
}

/**
 * Разобрать курсор; испорченный, от другого порядка или с ключом другой формы — 422 по полю `cursor`.
 * `keys` — сколько ключей порядка ждём массивом; без него ключ — одно значение.
 */
export function decodeCursor(value: string, sort: string): Cursor;
export function decodeCursor(value: string, sort: string, keys: number): Cursor<CursorValue[]>;
export function decodeCursor(value: string, sort: string, keys?: number): Cursor<CursorValue | CursorValue[]> {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (Array.isArray(parsed) && parsed.length === 3) {
      const [cursorSort, key, id] = parsed as unknown[];
      const keyValid =
        keys === undefined ? isValue(key) : Array.isArray(key) && key.length === keys && key.every(isValue);
      if (cursorSort === sort && keyValid && typeof id === 'string' && UUID.test(id)) {
        return { sort, key: key as CursorValue | CursorValue[], id };
      }
    }
  } catch {
    // ниже — общая ошибка
  }
  throw new AppError('validation_failed', 422, { errors: [{ field: 'cursor', code: 'invalid_format' }] });
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
