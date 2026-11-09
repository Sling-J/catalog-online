/**
 * Параметры адреса приходят строками (`?limit=30`), а схемы Zod из контракта ждут числа и логические
 * значения (`z.int()`). Приводим значения по типу поля схемы до проверки; что не приводится — оставляем
 * как есть, пусть схема вернёт ошибку по полю.
 */

type ZodDef = {
  type: string;
  innerType?: ZodLike;
  in?: ZodLike;
  element?: ZodLike;
  shape?: Record<string, ZodLike>;
};
type ZodLike = { _zod: { def: ZodDef } };

const WRAPPERS = new Set(['optional', 'nullable', 'default', 'prefault', 'readonly', 'catch', 'nonoptional']);

function isZod(value: unknown): value is ZodLike {
  return typeof value === 'object' && value !== null && '_zod' in value;
}

/** Снимает обёртки `optional`, `default`, `pipe`… до типа значения. */
function unwrap(schema: ZodLike): ZodDef {
  let def = schema._zod.def;
  for (let i = 0; i < 10; i++) {
    const next = WRAPPERS.has(def.type) ? def.innerType : def.type === 'pipe' ? def.in : undefined;
    if (!next) break;
    def = next._zod.def;
  }
  return def;
}

function coerceValue(def: ZodDef, value: unknown): unknown {
  if (def.type === 'array') {
    const items = Array.isArray(value) ? value : [value];
    return def.element ? items.map((item) => coerceValue(unwrap(def.element!), item)) : items;
  }
  if (typeof value !== 'string') return value;
  if (def.type === 'number') {
    const n = Number(value);
    return value.trim() !== '' && Number.isFinite(n) ? n : value;
  }
  if (def.type === 'boolean') {
    if (value === 'true') return true;
    if (value === 'false') return false;
  }
  return value;
}

export function coerceQuery(schema: unknown, value: unknown): unknown {
  if (!isZod(schema) || typeof value !== 'object' || value === null || Array.isArray(value)) return value;
  const shape = unwrap(schema).shape;
  if (!shape) return value;
  const result: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const field = shape[key];
    result[key] = field ? coerceValue(unwrap(field), item) : item;
  }
  return result;
}
