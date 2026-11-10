import ExcelJS from 'exceljs';
import { describe, expect, it } from 'vitest';

import {
  completeMapping,
  headersHash,
  mappingErrors,
  suggestMapping,
  TEMPLATE_HEADERS,
  type CompleteMapping,
} from './mapping.js';
import { detectDelimiter, ImportFileError, MAX_ROWS, readTable } from './read-table.js';
import { parseCategory, parsePrice, parseRows, parseStock } from './rows.js';
import { buildTemplate } from './template.js';

const csv = (text: string) => Buffer.from(text, 'utf8');
/** Windows-1251: кириллица А–я — подряд с 0xC0, «ё» и «Ё» — отдельно. */
const cp1251 = (text: string) =>
  Buffer.from(
    [...text].map((char) => {
      const code = char.charCodeAt(0);
      if (code >= 0x410 && code <= 0x44f) return code - 0x410 + 0xc0;
      if (char === 'ё') return 0xb8;
      if (char === 'Ё') return 0xa8;
      return code;
    }),
  );
const xlsx = async (rows: unknown[][]) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Лист1');
  for (const row of rows) sheet.addRow(row);
  return Buffer.from(await workbook.xlsx.writeBuffer());
};
const failure = async (file: Buffer) => {
  try {
    await readTable(file);
  } catch (error) {
    if (error instanceof ImportFileError) return error.code;
    throw error;
  }
  return null;
};

describe('чтение файла', () => {
  it('CSV: UTF-8 с меткой, «;», пустые строки пропускаются, номера строк — как в файле', async () => {
    const table = await readTable(
      csv('\ufeffАртикул;Название;Цена;Остаток\r\nKD-1;Куртка;18900;3\r\n\r\n;;;\r\nKD-2;"Платье; летнее";5000;0\r\n'),
    );
    expect(table.headers).toEqual(['Артикул', 'Название', 'Цена', 'Остаток']);
    expect(table.rows).toEqual([
      { number: 2, cells: ['KD-1', 'Куртка', '18900', '3'] },
      { number: 5, cells: ['KD-2', 'Платье; летнее', '5000', '0'] },
    ]);
  });

  it('CSV: Windows-1251 и запятая', async () => {
    const table = await readTable(cp1251('Артикул,Название,Цена,Остаток\nА-1,"Ёлка, зелёная",100,1\n'));
    expect(table.headers).toEqual(['Артикул', 'Название', 'Цена', 'Остаток']);
    expect(table.rows[0]!.cells).toEqual(['А-1', 'Ёлка, зелёная', '100', '1']);
  });

  it('CSV: UTF-16 с табуляцией («Текст Юникод» из Excel)', async () => {
    const text = '\ufeffАртикул\tНазвание\tЦена\tОстаток\nA-1\tКуртка\t100\t1\n';
    const table = await readTable(Buffer.from(text, 'utf16le'));
    expect(table.rows[0]!.cells).toEqual(['A-1', 'Куртка', '100', '1']);
  });

  it('CSV: строка короче или длиннее заголовка не ломает файл', async () => {
    const table = await readTable(csv('a;b;c;d\n1;2\n1;2;3;4;5\n'));
    expect(table.rows.map((row) => row.cells)).toEqual([
      ['1', '2', '', ''],
      ['1', '2', '3', '4'],
    ]);
  });

  it('разделитель — кого больше вне кавычек; поровну — «;»', () => {
    expect(detectDelimiter('a,b,c')).toBe(',');
    expect(detectDelimiter('a;b;"c,d,e,f"')).toBe(';');
    expect(detectDelimiter('a\tb\tc')).toBe('\t');
    expect(detectDelimiter('одна колонка')).toBe(';');
  });

  it('xlsx: числа, формулы, даты и оформленный текст — текстом; заголовок — первая непустая строка', async () => {
    const table = await readTable(
      await xlsx([
        [],
        ['  Артикул ', 'Название', 'Цена', 'Остаток', null, 'Дата', 'Цена'],
        [123, { richText: [{ text: 'Курт' }, { text: 'ка' }] }, 18900.000000000004, { formula: '1+2', result: 3 }, 'x', new Date('2026-11-10T00:00:00Z'), 5],
        [null, null, null, null, 'только в колонке без заголовка'],
        ['KD-2', 'Платье\nлетнее', 5000.5, 0],
      ]),
    ); // prettier-ignore
    // колонка без заголовка отброшена, повтор заголовка получил номер
    expect(table.headers).toEqual(['Артикул', 'Название', 'Цена', 'Остаток', 'Дата', 'Цена (2)']);
    expect(table.rows).toEqual([
      { number: 3, cells: ['123', 'Куртка', '18900', '3', '2026-11-10', '5'] },
      { number: 5, cells: ['KD-2', 'Платье летнее', '5000.5', '0', '', ''] },
    ]);
  });

  it('не таблица, мало колонок, нет строк, слишком много строк', async () => {
    expect(await failure(Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0x00, 0x00, 0x01, 0x00]))).toBe('unreadable_file');
    expect(await failure(Buffer.from('PK\u0003\u0004 это не архив'))).toBe('unreadable_file');
    expect(await failure(csv(''))).toBe('unreadable_file');
    expect(await failure(csv('a;"b\n1;2'))).toBe('unreadable_file');
    expect(await failure(csv('это не таблица\n'))).toBe('no_required_columns');
    expect(await failure(csv('Артикул;Название;Цена;Остаток\n;;;\n'))).toBe('no_rows');
    const many = `a;b;c;d\n${'1;2;3;4\n'.repeat(MAX_ROWS + 1)}`;
    expect(await failure(csv(many))).toBe('too_many_rows');
    const exact = await readTable(csv(`a;b;c;d\n${'1;2;3;4\n'.repeat(MAX_ROWS)}`));
    expect(exact.rows).toHaveLength(MAX_ROWS);
  });

  it('шаблон читается сам: заголовки шаблона и строка-пример', async () => {
    const table = await readTable(await buildTemplate());
    expect(table.headers).toEqual(TEMPLATE_HEADERS);
    expect(table.rows).toHaveLength(1);
    expect(table.rows[0]!.cells.slice(0, 4)).toEqual(['KD-110', 'Куртка демисезонная', '18900', '3']);
  });
});

describe('сопоставление колонок', () => {
  it('файл по шаблону: поля по именам, остальные колонки — свойства; шаг «Колонки» не нужен', () => {
    const { mapping, templateLike } = suggestMapping([...TEMPLATE_HEADERS, 'Сезон']);
    expect(templateLike).toBe(true);
    expect(mapping.map((item) => [item.column, item.target, item.attributeName])).toEqual([
      ['Артикул', 'sku', null],
      ['Название', 'name', null],
      ['Цена', 'price', null],
      ['Остаток', 'stock', null],
      ['Код товара', 'group_key', null],
      ['Штрихкод', 'barcode', null],
      ['Категория', 'category', null],
      ['Описание', 'description', null],
      ['Рост', 'attribute', 'Рост'],
      ['Цвет', 'attribute', 'Цвет'],
      ['Сезон', 'attribute', 'Сезон'],
    ]);
  });

  it('выгрузка из учётной программы: узнаём по синонимам, но шаг «Колонки» нужен', () => {
    const headers = [
      'Код',
      'Номенклатура',
      'Цена розничная',
      'Количество',
      'Группа',
      'Размер',
      'Штрих-код',
      'Ед. изм.',
    ];
    const { mapping, templateLike } = suggestMapping(headers);
    expect(templateLike).toBe(false);
    expect(mapping.map((item) => item.target)).toEqual([
      'sku', 'name', 'price', 'stock', 'category', 'attribute', 'barcode', 'skip',
    ]); // prettier-ignore
    expect(mapping[5]).toEqual({ column: 'Размер', target: 'attribute', attributeName: 'Размер' });
  });

  it('второе название того же поля не становится свойством', () => {
    const { mapping } = suggestMapping(['АРТИКУЛ', 'Код', 'Наименование', 'Цена', 'Цена закупочная', 'Остаток']);
    expect(mapping.map((item) => item.target)).toEqual(['sku', 'skip', 'name', 'price', 'skip', 'stock']);
  });

  it('ошибки: нет обязательного поля, поле дважды, чужая колонка, свойства с одним именем', () => {
    const headers = ['A', 'B', 'C', 'D', 'E'];
    const base = [
      { column: 'A', target: 'sku' as const },
      { column: 'B', target: 'name' as const },
      { column: 'C', target: 'price' as const },
    ];
    expect(mappingErrors([...base, { column: 'D', target: 'stock' }], headers)).toEqual([]);
    expect(mappingErrors(base, headers)).toEqual([{ field: 'mapping', code: 'missing_required' }]);
    expect(mappingErrors([...base, { column: 'D', target: 'stock' }, { column: 'E', target: 'price' }], headers)).toEqual([
      { field: 'mapping', code: 'duplicate_target' },
    ]);
    expect(
      mappingErrors([...base, { column: 'D', target: 'stock' }, { column: 'Z', target: 'skip' }, { column: 'A', target: 'skip' }], headers),
    ).toEqual([
      { field: 'mapping.4.column', code: 'not_found' },
      { field: 'mapping.5.column', code: 'duplicate' },
    ]);
    expect(
      mappingErrors(
        [
          { column: 'A', target: 'attribute', attributeName: 'Рост' },
          { column: 'B', target: 'attribute', attributeName: ' рост ' },
          { column: 'C', target: 'attribute', attributeName: 'х'.repeat(61) },
        ],
        headers,
      ).map((error) => `${error.field}:${error.code}`),
    ).toEqual(['mapping.1.attributeName:duplicate', 'mapping.2.attributeName:too_long', 'mapping:missing_required']);
  }); // prettier-ignore

  it('полный вид: по порядку файла, пропущенные колонки не грузятся, свойство без имени — по заголовку', () => {
    expect(
      completeMapping(
        [
          { column: 'B', target: 'attribute' },
          { column: 'A', target: 'sku', attributeName: 'лишнее' },
        ],
        ['A', 'B', 'C'],
      ),
    ).toEqual([
      { column: 'A', target: 'sku', attributeName: null },
      { column: 'B', target: 'attribute', attributeName: 'B' },
      { column: 'C', target: 'skip', attributeName: null },
    ]);
  });

  it('ключ запомненного сопоставления не зависит от порядка колонок', () => {
    expect(headersHash(['A', 'B'])).toBe(headersHash(['B', 'A']));
    expect(headersHash(['A', 'B'])).not.toBe(headersHash(['A', 'B', 'C']));
  });
});

describe('строки', () => {
  it('цена: пробелы, копейки, валюта, разделитель тысяч', () => {
    expect(parsePrice('18900')).toBe(18900);
    expect(parsePrice('18 900,00')).toBe(18900);
    expect(parsePrice('18\u00a0900.49 ₸')).toBe(18900);
    expect(parsePrice('18,900.50')).toBe(18901);
    expect(parsePrice('18.900,50')).toBe(18901);
    expect(parsePrice('18,900')).toBe(18900);
    expect(parsePrice('1 250 тг.')).toBe(1250);
    expect(parsePrice('0')).toBe(0);
    for (const bad of ['', '12 5OO', '-5', 'договорная', '1,2,3,4', '99999999999']) expect(parsePrice(bad), bad).toBeNull();
  }); // prettier-ignore

  it('остаток: количество 1С, дробное вниз, отрицательное — ноль', () => {
    expect(parseStock('3')).toBe(3);
    expect(parseStock('3,000')).toBe(3);
    expect(parseStock('12 шт.')).toBe(12);
    expect(parseStock('1 000')).toBe(1000);
    expect(parseStock('2.7')).toBe(2);
    expect(parseStock('-4')).toBe(0);
    for (const bad of ['', 'много', '1/2', '99999999999']) expect(parseStock(bad), bad).toBeNull();
  });

  it('категория: путь через «/», не глубже двух уровней', () => {
    expect(parseCategory('Девочки / Куртки')).toEqual(['Девочки', 'Куртки']);
    expect(parseCategory(' Базовое ')).toEqual(['Базовое']);
    expect(parseCategory('Одежда/Детская/Куртки')).toEqual(['Одежда', 'Детская']);
    expect(parseCategory(' / ')).toBeNull();
  });

  const HEADERS = ['Артикул', 'Название', 'Цена', 'Остаток', 'Код товара', 'Штрихкод', 'Категория', 'Описание', 'Рост'];
  const MAPPING: CompleteMapping = suggestMapping(HEADERS).mapping;
  const table = (...rows: string[][]) => ({
    headers: HEADERS,
    rows: rows.map((cells, i) => ({ number: i + 2, cells })),
  });

  it('годная строка: поля по сопоставлению, пустое — null, свойства только с значением', () => {
    const parsed = parseRows(
      table(
        ['KD-110', 'Куртка', '18 900,00', '3', 'KD-1', '487', 'Девочки / Куртки', 'Тёплая', '110'],
        ['TS-1', 'Футболка', '4500', '0', '', '', '', '', ''],
      ),
      MAPPING,
    );
    expect(parsed.errors).toEqual([]);
    expect(parsed.rows).toEqual([
      {
        number: 2,
        sku: 'KD-110',
        name: 'Куртка',
        price: 18900,
        stock: 3,
        groupKey: 'KD-1',
        barcode: '487',
        category: ['Девочки', 'Куртки'],
        description: 'Тёплая',
        attributes: [{ name: 'Рост', value: '110' }],
      },
      {
        number: 3,
        sku: 'TS-1',
        name: 'Футболка',
        price: 4500,
        stock: 0,
        groupKey: null,
        barcode: null,
        category: null,
        description: null,
        attributes: [],
      },
    ]);
  });

  it('ошибки по строкам: одна на строку, артикулы таких строк запоминаются', () => {
    const ok = ['Куртка', '100', '1', '', '', '', '', ''];
    const parsed = parseRows(
      table(
        ['A-1', ...ok],
        ['', ...ok],
        ['A-1', ...ok],
        ['A-2', '', '100', '1', '', '', '', '', ''],
        ['A-3', 'Куртка', '12 5OO', '1', '', '', '', '', ''],
        ['A-4', 'Куртка', '100', '', '', '', '', '', ''],
        ['A-5', 'Куртка', '100', '1', '', '', '', '', 'х'.repeat(61)],
        ['х'.repeat(65), ...ok],
        ['A-6', 'х'.repeat(201), '', '', '', '', '', '', ''],
      ),
      MAPPING,
    );
    expect(parsed.rows.map((row) => row.sku)).toEqual(['A-1']);
    expect(parsed.errors.map((error) => [error.row, error.column, error.code])).toEqual([
      [3, 'Артикул', 'sku_missing'],
      [4, 'Артикул', 'sku_duplicate'],
      [5, 'Название', 'name_missing'],
      [6, 'Цена', 'price_invalid'],
      [7, 'Остаток', 'stock_invalid'],
      [8, 'Рост', 'too_long'],
      [9, 'Артикул', 'too_long'],
      [10, 'Название', 'too_long'],
    ]);
    expect(parsed.errors[3]).toEqual({ row: 6, column: 'Цена', value: '12 5OO', code: 'price_invalid' });
    expect(parsed.errors[0]!.value).toBeNull();
    // повтор и строки без годного артикула сюда не идут
    expect(parsed.errorSkus).toEqual(['A-2', 'A-3', 'A-4', 'A-5', 'A-6']);
  });
});
