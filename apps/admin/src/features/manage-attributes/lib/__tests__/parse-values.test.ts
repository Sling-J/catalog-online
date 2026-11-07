import { describe, expect, it } from 'vitest';

import { parseValues } from '../parse-values';

describe('значения нового свойства из строки', () => {
  it('делит по запятой и точке с запятой, убирает пустые и повторы', () => {
    expect(parseValues(' синий, красный;; Синий ,белый ')).toEqual(['синий', 'красный', 'белый']);
    expect(parseValues('')).toEqual([]);
  });
});
