import type { FieldError } from '../../../core/errors/index.js';

const key = (value: string) => value.toLowerCase();

/** Значения нового свойства: пробелы по краям сняты, пустые и повторы (без учёта регистра) отброшены — как в моках. */
export function uniqueValues(values: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values.map((item) => item.trim()).filter(Boolean)) {
    if (seen.has(key(value))) continue;
    seen.add(key(value));
    result.push(value);
  }
  return result;
}

export type ValueInput = { id?: string; value: string };
export type ValuesCheck =
  | { kind: 'invalid'; errors: FieldError[] }
  | { kind: 'taken'; errors: FieldError[] }
  | { kind: 'ok'; values: { id: string | null; value: string }[] };

/**
 * Проверка `PUT …/values`: пустое значение, чужой или повторённый id — 422 по ячейке; повтор значения без учёта
 * регистра — 409 `attribute_value_taken`, в ошибках — повторившиеся (`values.3.value`, `taken`).
 */
export function checkValues(input: ValueInput[], currentIds: Set<string>): ValuesCheck {
  const values = input.map((item) => ({ id: item.id ?? null, value: item.value.trim() }));
  const invalid: FieldError[] = [];
  const ids = new Set<string>();
  values.forEach((item, i) => {
    if (!item.value) invalid.push({ field: `values.${i}.value`, code: 'required' });
    if (item.id === null) return;
    if (!currentIds.has(item.id)) invalid.push({ field: `values.${i}.id`, code: 'not_found' });
    else if (ids.has(item.id)) invalid.push({ field: `values.${i}.id`, code: 'duplicate' });
    ids.add(item.id);
  });
  if (invalid.length) return { kind: 'invalid', errors: invalid };

  const seen = new Set<string>();
  const taken: FieldError[] = [];
  values.forEach((item, i) => {
    if (seen.has(key(item.value))) taken.push({ field: `values.${i}.value`, code: 'taken' });
    seen.add(key(item.value));
  });
  if (taken.length) return { kind: 'taken', errors: taken };
  return { kind: 'ok', values };
}
