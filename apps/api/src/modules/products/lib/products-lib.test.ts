import { describe, expect, it } from 'vitest';

import { decodeCursor, encodeCursor } from '../../../core/pagination/index.js';
import { generateSkus, newShortId, slugify } from './slug.js';
import { cleanVariants, variantTableErrors } from './variants.js';

describe('slugify', () => {
  it('русский и казахский — латиницей, без лишних знаков', () => {
    expect(slugify('Куртка демисезонная')).toBe('kurtka-demisezonnaya');
    expect(slugify('Қыздарға арналған көйлек')).toBe('qyzdarga-arnalgan-koylek');
    expect(slugify('  Платье «Ёлочка» №5!  ')).toBe('plate-yolochka-no5');
    expect(slugify('Shirt Café')).toBe('shirt-cafe');
  });

  it('пусто — tovar; длинное — обрезается по слову', () => {
    expect(slugify('!!!')).toBe('tovar');
    const long = slugify('Очень длинное название товара для детей от трёх до семи лет с капюшоном');
    expect(long.length).toBeLessThanOrEqual(60);
    expect(long.endsWith('-')).toBe(false);
  });
});

describe('коды и артикулы', () => {
  it('shortId — 5 символов base36', () => {
    expect(newShortId()).toMatch(/^[0-9a-z]{5}$/);
  });

  it('артикулы <КОД>-n, занятые пропускаются', () => {
    expect(generateSkus('7f3k2', 3, new Set(['7F3K2-2']))).toEqual(['7F3K2-1', '7F3K2-3', '7F3K2-4']);
    expect(generateSkus('7f3k2', 0, new Set())).toEqual([]);
  });
});

describe('таблица вариантов', () => {
  const ROST = '0192d000-0000-7000-8000-0000000000a1';
  const COLOR = '0192d000-0000-7000-8000-0000000000a2';
  const row = (values: { attributeId: string; value: string }[], extra: object = {}) => ({
    price: 1000,
    stock: 1,
    values,
    ...extra,
  });

  it('пробелы снимаются, пустой артикул — «придумать»', () => {
    expect(cleanVariants([row([{ attributeId: ROST, value: ' 98 ' }], { sku: '  ', barcode: ' 123 ' })])).toEqual([
      { id: null, sku: null, barcode: '123', price: 1000, stock: 1, values: [{ attributeId: ROST, value: '98' }] },
    ]);
  });

  it('повторы: артикул, свойство в строке, набор размеров (без учёта регистра и порядка), id', () => {
    const errors = variantTableErrors(
      cleanVariants([
        row(
          [
            { attributeId: ROST, value: '98' },
            { attributeId: COLOR, value: 'Красный' },
          ],
          { sku: 'A', id: '0192d000-0000-7000-8000-000000000001' },
        ),
        row(
          [
            { attributeId: COLOR, value: 'красный' },
            { attributeId: ROST, value: '98' },
          ],
          { sku: 'A', id: '0192d000-0000-7000-8000-000000000001' },
        ),
        row([
          { attributeId: ROST, value: '104' },
          { attributeId: ROST, value: '110' },
        ]),
        row([{ attributeId: ROST, value: ' ' }]),
      ]),
    );
    expect(errors).toEqual([
      { field: 'variants.1.id', code: 'duplicate' },
      { field: 'variants.1.sku', code: 'duplicate' },
      { field: 'variants.1.values', code: 'duplicate' },
      { field: 'variants.2.values.1.attributeId', code: 'duplicate' },
      { field: 'variants.3.values.0.value', code: 'required' },
    ]);
  });

  it('товар без размеров — одна строка без значений; две такие — повтор', () => {
    expect(variantTableErrors(cleanVariants([row([])]))).toEqual([]);
    expect(variantTableErrors(cleanVariants([row([]), row([])]))).toEqual([
      { field: 'variants.1.values', code: 'duplicate' },
    ]);
  });
});

describe('курсор', () => {
  const id = '0192d000-0000-7000-8000-000000000001';

  it('туда и обратно; от другого порядка или испорченный — 422 по cursor', () => {
    const cursor = encodeCursor({ sort: 'price_asc', key: 4500, id });
    expect(decodeCursor(cursor, 'price_asc')).toEqual({ sort: 'price_asc', key: 4500, id });
    for (const bad of [encodeCursor({ sort: 'new', key: 'x', id }), 'garbage', '']) {
      expect(() => decodeCursor(bad, 'price_asc')).toThrow(
        expect.objectContaining({
          code: 'validation_failed',
          options: { errors: [{ field: 'cursor', code: 'invalid_format' }] },
        }),
      );
    }
  });
});
