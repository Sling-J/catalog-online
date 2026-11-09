import { AppError } from '../errors/index.js';

/**
 * Курсор списков (API3): закладка «после этой строки» — значение сортировки и id последней показанной строки
 * (решение основателя 2026-11-09, T-407). Снаружи — непрозрачная строка base64url.
 */
export type Cursor = {
  /** Порядок, для которого выдан курсор: с другим порядком курсор недействителен. */
  sort: string;
  /** Значение сортировки последней строки (дата — строкой из базы, без потери микросекунд). */
  key: string | number;
  id: string;
};

export function encodeCursor(cursor: Cursor): string {
  return Buffer.from(JSON.stringify([cursor.sort, cursor.key, cursor.id])).toString('base64url');
}

/** Разобрать курсор; испорченный или от другого порядка — 422 по полю `cursor`. */
export function decodeCursor(value: string, sort: string): Cursor {
  try {
    const parsed: unknown = JSON.parse(Buffer.from(value, 'base64url').toString('utf8'));
    if (Array.isArray(parsed) && parsed.length === 3) {
      const [cursorSort, key, id] = parsed as unknown[];
      if (
        cursorSort === sort &&
        (typeof key === 'string' || typeof key === 'number') &&
        typeof id === 'string' &&
        UUID.test(id)
      ) {
        return { sort, key, id };
      }
    }
  } catch {
    // ниже — общая ошибка
  }
  throw new AppError('validation_failed', 422, { errors: [{ field: 'cursor', code: 'invalid_format' }] });
}

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
