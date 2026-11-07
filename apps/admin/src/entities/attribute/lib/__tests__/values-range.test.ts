import { describe, expect, it } from 'vitest';

import { valuesRange } from '../values-range';

const values = (...list: string[]) => list.map((value, position) => ({ id: value, value, position, usageCount: 0 }));

describe('диапазон значений свойства', () => {
  it('числа — от меньшего к большему, как написаны', () => {
    expect(valuesRange(values('24', '25', '31'))).toBe('24–31');
    expect(valuesRange(values('110', '92', '104'))).toBe('92–110');
    expect(valuesRange(values('36,5', '38'))).toBe('36,5–38');
  });

  it('не числа или одно значение — без диапазона', () => {
    expect(valuesRange(values('синий', 'красный'))).toBeNull();
    expect(valuesRange(values('S', '42'))).toBeNull();
    expect(valuesRange(values('104'))).toBeNull();
  });
});
