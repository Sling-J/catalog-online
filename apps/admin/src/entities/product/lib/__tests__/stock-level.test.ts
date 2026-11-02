import { describe, expect, it } from 'vitest';

import { stockLevel } from '../stock-level';

describe('stockLevel', () => {
  it('нет, мало до порога включительно, есть', () => {
    expect(stockLevel(0, 2)).toBe('out');
    expect(stockLevel(2, 2)).toBe('low');
    expect(stockLevel(3, 2)).toBe('in');
  });
});
