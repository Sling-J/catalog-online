/** Файл импорта не больше 20 МБ (`createUpload`, purpose=import). */
export const IMPORT_MAX_BYTES = 20 * 1024 * 1024;
const XLSX_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export type ImportFileProblem = 'type' | 'size';

/** Тип для хранилища: по расширению — Windows часто отдаёт CSV как `application/vnd.ms-excel` или без типа. */
export function importContentType(file: File): string | null {
  const name = file.name.toLowerCase();
  if (name.endsWith('.xlsx')) return XLSX_TYPE;
  if (name.endsWith('.csv')) return 'text/csv';
  return null;
}

/** Что не так с файлом до загрузки (FR-A3: .xlsx и .csv). */
export function importFileProblem(file: File): ImportFileProblem | null {
  if (!importContentType(file)) return 'type';
  if (file.size > IMPORT_MAX_BYTES) return 'size';
  return null;
}
