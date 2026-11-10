import ExcelJS from 'exceljs';

import { TEMPLATE_HEADERS, TEMPLATE_SAMPLE } from './mapping.js';

export const TEMPLATE_FILE_NAME = 'shablon-tovarov.xlsx';
export const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Шаблон Excel (FR-A3): заголовки и одна строка-пример. Все ячейки — текст: артикул «00123» и штрихкод Excel не
 * превратит в число.
 */
export async function buildTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Товары');
  sheet.columns = TEMPLATE_HEADERS.map((header) => ({
    header,
    width: Math.max(14, header.length + 4),
    style: { numFmt: '@' },
  }));
  sheet.getRow(1).font = { bold: true };
  sheet.addRow(TEMPLATE_SAMPLE);
  sheet.views = [{ state: 'frozen', ySplit: 1 }];
  return Buffer.from(await workbook.xlsx.writeBuffer());
}
