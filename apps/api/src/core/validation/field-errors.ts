import type { FieldError } from '../errors/index.js';

/** Issue из Standard Schema (`@standard-schema/spec`; пакет приходит с Nest, своей зависимости не заводим). */
export type SchemaIssue = {
  readonly message: string;
  readonly path?: ReadonlyArray<PropertyKey | { readonly key: PropertyKey }> | undefined;
};

/** Поля issue Zod 4, которых нет в общем интерфейсе Standard Schema. */
type ZodIssueExtra = {
  code?: string;
  origin?: string;
  minimum?: number | bigint;
  maximum?: number | bigint;
  keys?: string[];
};

function pathOf(issue: SchemaIssue): (string | number)[] {
  return (issue.path ?? []).map((segment) => {
    const key = typeof segment === 'object' ? segment.key : segment;
    return typeof key === 'number' ? key : String(key);
  });
}

function valueAt(root: unknown, path: (string | number)[]): unknown {
  let current = root;
  for (const key of path) {
    if (typeof current !== 'object' || current === null) return undefined;
    current = (current as Record<string | number, unknown>)[key];
  }
  return current;
}

const num = (value: number | bigint | undefined) => (typeof value === 'bigint' ? Number(value) : value);

/**
 * Ошибки схемы → `errors[]` контракта (API4): `{ field: 'variants.2.price', code: 'out_of_range', params }`.
 * Коды — те, что понимает админка: required, too_long, too_short, invalid_format, out_of_range…
 */
export function toFieldErrors(issues: readonly SchemaIssue[], input: unknown): FieldError[] {
  return issues.flatMap((issue): FieldError[] => {
    const path = pathOf(issue);
    const field = path.join('.');
    const { code, origin, minimum, maximum, keys } = issue as SchemaIssue & ZodIssueExtra;
    const value = valueAt(input, path);

    switch (code) {
      case 'invalid_type':
        return [{ field, code: value === undefined || value === null ? 'required' : 'invalid_type' }];
      case 'too_small':
        if (origin === 'string' && num(minimum) === 1) return [{ field, code: 'required' }];
        if (origin === 'string') return [{ field, code: 'too_short', params: { min: num(minimum) } }];
        if (origin === 'array' || origin === 'set') return [{ field, code: 'too_few', params: { min: num(minimum) } }];
        return [{ field, code: 'out_of_range', params: { min: num(minimum) } }];
      case 'too_big':
        if (origin === 'string') return [{ field, code: 'too_long', params: { max: num(maximum) } }];
        if (origin === 'array' || origin === 'set') return [{ field, code: 'too_many', params: { max: num(maximum) } }];
        return [{ field, code: 'out_of_range', params: { max: num(maximum) } }];
      case 'invalid_format':
        return [{ field, code: 'invalid_format' }];
      case 'invalid_value':
        return [{ field, code: 'invalid_value' }];
      case 'unrecognized_keys':
        return (keys ?? []).map((key) => ({ field: field ? `${field}.${key}` : key, code: 'unknown_field' }));
      default:
        return [{ field, code: 'invalid' }];
    }
  });
}
