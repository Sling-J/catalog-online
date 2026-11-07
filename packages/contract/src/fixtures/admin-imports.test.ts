import { describe, expect, it } from 'vitest';

import {
  createImportStore,
  IMPORT_STEP_MS,
  importTemplateXlsx,
  mappingProblem,
  TEMPLATE_HEADERS,
} from './admin-imports.js';

const T0 = 1_000_000;
const after = (steps: number) => T0 + steps * IMPORT_STEP_MS;

describe('импорт на моках', () => {
  it('файл по шаблону: чтение → проверка без шага «Колонки»', () => {
    const store = createImportStore(false);
    const created = store.create('ostatki.xlsx', T0)!;
    expect(created.status).toBe('parsing');
    expect(store.get(created.id, after(1))).toMatchObject({ status: 'previewing', headers: TEMPLATE_HEADERS });
    expect(store.get(created.id, after(2))?.preview).toMatchObject({ rows: 156, errors: 0 });
  });

  it('выгрузка 1С ждёт сопоставления, а второй такой файл идёт сразу к проверке', () => {
    const store = createImportStore(false);
    const first = store.create('vygruzka_1c.xlsx', T0)!;
    const waiting = store.get(first.id, after(1))!;
    expect(waiting.status).toBe('mapping');
    const mapping = waiting.mapping!.map((item) =>
      item.column === 'Код'
        ? { ...item, target: 'sku' as const }
        : item.column === 'Цена розничная'
          ? { ...item, target: 'price' as const }
          : item,
    );
    expect(mappingProblem(waiting.mapping!)).toBe('missing_required');
    expect(mappingProblem(mapping)).toBeNull();
    store.setMapping(first.id, mapping, after(1));
    expect(store.get(first.id, after(2))?.status).toBe('previewed');
    expect(store.errors(first.id, after(2))).toHaveLength(3);
    store.cancel(first.id, after(2));

    const second = store.create('vygruzka_1c_02-11.xlsx', after(3))!;
    expect(store.get(second.id, after(4))).toMatchObject({ status: 'previewing', mappingRemembered: true, mapping });
  });

  it('применение: обнуление по выбору, второй импорт во время первого — нельзя', () => {
    const store = createImportStore(false);
    const item = store.create('ostatki.xlsx', T0)!;
    expect(store.create('eshche.xlsx', T0)).toBeNull();
    store.get(item.id, after(2));
    store.apply(item.id, false, after(2));
    expect(store.cancel(item.id, after(2))).toBe('conflict');
    expect(store.get(item.id, after(3))).toMatchObject({ status: 'done', result: { zeroed: 0, updated: 152 } });
    expect(store.create('eshche.xlsx', after(3))).not.toBeNull();
  });

  it('нечитаемый файл — failed с причиной', () => {
    const store = createImportStore(false);
    const item = store.create('bad.csv', T0)!;
    expect(store.get(item.id, after(1))).toMatchObject({ status: 'failed', failureCode: 'unreadable_file' });
  });

  it('одно поле дважды — ошибка сопоставления', () => {
    expect(
      mappingProblem([
        { column: 'A', target: 'sku' },
        { column: 'B', target: 'name' },
        { column: 'C', target: 'price' },
        { column: 'D', target: 'stock' },
        { column: 'E', target: 'stock' },
      ]),
    ).toBe('duplicate_target');
  });

  it('шаблон — zip с листом и заголовками', () => {
    const bytes = importTemplateXlsx();
    expect([...bytes.slice(0, 4)]).toEqual([0x50, 0x4b, 0x03, 0x04]);
    expect(new TextDecoder().decode(bytes)).toContain('<t>Артикул</t>');
  });
});
