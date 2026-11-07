import { describe, expect, it } from 'vitest';

import { importStep, isImportOpen, isImportWorking } from '../import-status';

describe('статус импорта', () => {
  it('шаг мастера по статусу', () => {
    expect(importStep('parsing')).toBe(1);
    expect(importStep('mapping')).toBe(2);
    expect(importStep('previewing')).toBe(3);
    expect(importStep('previewed')).toBe(3);
    expect(importStep('applying')).toBe(4);
    expect(importStep('done')).toBe(4);
    expect(importStep('failed')).toBe(1);
  });

  it('перечитываем только фоновые шаги; открытый импорт — пока не применён и не отменён', () => {
    expect(isImportWorking('mapping')).toBe(false);
    expect(isImportWorking('applying')).toBe(true);
    expect(isImportOpen('previewed')).toBe(true);
    expect(isImportOpen('done')).toBe(false);
    expect(isImportOpen('cancelled')).toBe(false);
  });
});
