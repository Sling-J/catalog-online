import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { coerceQuery } from './coerce-query.js';
import { toFieldErrors } from './field-errors.js';

describe('coerceQuery', () => {
  const schema = z.object({
    q: z.string().optional(),
    limit: z.int().min(1).optional().default(30),
    hidden: z.boolean().optional(),
    ids: z.array(z.int()).optional(),
  });

  it('приводит строки к числам, логическим значениям и массивам по схеме', () => {
    expect(coerceQuery(schema, { q: '42', limit: '5', hidden: 'true', ids: '7' })).toEqual({
      q: '42',
      limit: 5,
      hidden: true,
      ids: [7],
    });
    expect(coerceQuery(schema, { ids: ['1', '2'] })).toEqual({ ids: [1, 2] });
    expect(coerceQuery(schema, { ids: '1,2,' })).toEqual({ ids: [1, 2] });
    expect(coerceQuery(schema, { ids: '' })).toEqual({ ids: [] });
  });

  it('неприводимое оставляет как есть — ошибку вернёт схема', () => {
    expect(coerceQuery(schema, { limit: 'abc', hidden: 'yes', extra: '1' })).toEqual({
      limit: 'abc',
      hidden: 'yes',
      extra: '1',
    });
    expect(coerceQuery(schema, { limit: '' })).toEqual({ limit: '' });
  });

  it('не объект или не схема Zod — без изменений', () => {
    expect(coerceQuery(schema, 'x')).toBe('x');
    expect(coerceQuery({}, { limit: '5' })).toEqual({ limit: '5' });
  });
});

describe('toFieldErrors', () => {
  const errorsOf = (schema: z.ZodType, input: unknown) => {
    const result = schema.safeParse(input);
    if (result.success) throw new Error('ожидалась ошибка');
    return toFieldErrors(result.error.issues, input);
  };

  it('коды по полям для админки', () => {
    const schema = z.object({
      name: z.string().min(1).max(5),
      sku: z.string().min(3),
      price: z.int().min(0),
      email: z.email(),
      stock: z.enum(['levels', 'exact']),
      variants: z.array(z.object({ size: z.string() })),
      photos: z.array(z.string()).max(1),
    });
    expect(
      errorsOf(schema, {
        name: 'слишком длинно',
        sku: 'a',
        price: -1,
        email: 'x',
        stock: 'all',
        variants: [{ size: 1 }, {}],
        photos: ['a', 'b'],
      }),
    ).toEqual([
      { field: 'name', code: 'too_long', params: { max: 5 } },
      { field: 'sku', code: 'too_short', params: { min: 3 } },
      { field: 'price', code: 'out_of_range', params: { min: 0 } },
      { field: 'email', code: 'invalid_format' },
      { field: 'stock', code: 'invalid_value' },
      { field: 'variants.0.size', code: 'invalid_type' },
      { field: 'variants.1.size', code: 'required' },
      { field: 'photos', code: 'too_many', params: { max: 1 } },
    ]);
  });

  it('пустая строка при min(1) и отсутствующее поле — required', () => {
    const schema = z.object({ name: z.string().min(1), phone: z.string() });
    expect(errorsOf(schema, { name: '' })).toEqual([
      { field: 'name', code: 'required' },
      { field: 'phone', code: 'required' },
    ]);
  });

  it('лишние поля в строгой схеме — unknown_field', () => {
    expect(errorsOf(z.strictObject({ a: z.string() }), { a: 'x', b: 1 })).toEqual([
      { field: 'b', code: 'unknown_field' },
    ]);
  });
});
