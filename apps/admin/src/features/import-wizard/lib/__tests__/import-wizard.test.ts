import type { ColumnMapping } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import { importContentType, importFileProblem } from '../import-file';
import { mappingFromValue, mappingValue, missingTargets, repeatedTargets } from '../mapping';

const file = (name: string, size = 10) => new File([new Uint8Array(size)], name);

describe('файл импорта', () => {
  it('принимает .xlsx и .csv по расширению, тип — по расширению', () => {
    expect(importFileProblem(file('Остатки.XLSX'))).toBeNull();
    expect(importContentType(file('ostatki.csv'))).toBe('text/csv');
    expect(importFileProblem(file('ostatki.xls'))).toBe('type');
    expect(importFileProblem(file('photo.jpg'))).toBe('type');
  });

  it('больше 20 МБ — нельзя', () => {
    expect(importFileProblem(file('big.csv', 20 * 1024 * 1024 + 1))).toBe('size');
  });
});

describe('сопоставление колонок', () => {
  const base: ColumnMapping[] = [
    { column: 'Код', target: 'sku' },
    { column: 'Номенклатура', target: 'name' },
    { column: 'Размер', target: 'attribute', attributeName: 'Рост' },
    { column: 'Ед. изм.', target: 'skip' },
  ];

  it('значение пункта списка туда и обратно', () => {
    expect(mappingValue(base[2]!)).toBe('attribute:Рост');
    expect(mappingFromValue('Размер', 'attribute:Рост')).toEqual(base[2]);
    expect(mappingFromValue('Цена', 'price')).toEqual({ column: 'Цена', target: 'price', attributeName: null });
  });

  it('не хватает цены и остатка; поле дважды', () => {
    expect(missingTargets(base)).toEqual(['price', 'stock']);
    expect(repeatedTargets(base)).toEqual([]);
    expect(repeatedTargets([...base, { column: 'Артикул', target: 'sku' }])).toEqual(['sku']);
  });
});
