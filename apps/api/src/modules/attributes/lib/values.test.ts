import { describe, expect, it } from 'vitest';

import { checkValues, uniqueValues } from './values.js';

describe('значения свойства', () => {
  it('новое свойство: пробелы сняты, пустые и повторы без учёта регистра отброшены', () => {
    expect(uniqueValues([' S ', 'M', 's', '', '  ', 'XL'])).toEqual(['S', 'M', 'XL']);
  });

  it('PUT: пустое, чужой и повторённый id — ошибки по ячейкам', () => {
    const result = checkValues(
      [{ id: 'a', value: ' ' }, { id: 'zzz', value: 'M' }, { id: 'a', value: 'L' }, { value: 'XL' }],
      new Set(['a', 'b']),
    );
    expect(result).toEqual({
      kind: 'invalid',
      errors: [
        { field: 'values.0.value', code: 'required' },
        { field: 'values.1.id', code: 'not_found' },
        { field: 'values.2.id', code: 'duplicate' },
      ],
    });
  });

  it('PUT: повтор значения — taken у повторившегося', () => {
    expect(checkValues([{ id: 'a', value: 'S' }, { value: 'M' }, { value: ' s ' }], new Set(['a']))).toEqual({
      kind: 'taken',
      errors: [{ field: 'values.2.value', code: 'taken' }],
    });
  });

  it('PUT: всё верно — значения без пробелов, новые без id', () => {
    expect(checkValues([{ value: ' M ' }, { id: 'a', value: 'S' }], new Set(['a']))).toEqual({
      kind: 'ok',
      values: [
        { id: null, value: 'M' },
        { id: 'a', value: 'S' },
      ],
    });
  });
});
