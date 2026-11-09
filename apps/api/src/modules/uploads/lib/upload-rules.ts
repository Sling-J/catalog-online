import type { FieldError } from '../../../core/errors/index.js';

export type UploadPurpose = 'product_photo' | 'logo' | 'import';

const MB = 1024 * 1024;
const IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
};
const IMPORT_TYPES: Record<string, string> = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
  'text/csv': 'csv',
};

/** Что и какого размера можно загрузить (контракт `createUpload`; FR-A4 — фото до 15 МБ, FR-A3 — импорт до 20 МБ). */
export const UPLOAD_RULES: Record<UploadPurpose, { types: Record<string, string>; maxBytes: number }> = {
  product_photo: { types: IMAGE_TYPES, maxBytes: 15 * MB },
  logo: { types: IMAGE_TYPES, maxBytes: 15 * MB },
  import: { types: IMPORT_TYPES, maxBytes: 20 * MB },
};

/** Сколько живёт ссылка на загрузку. */
export const UPLOAD_LINK_TTL_SEC = 10 * 60;

/**
 * Проверка заявленного файла. Тип — тот, что придёт в заголовке `PUT` (админка подставляет его по расширению,
 * если браузер не знает: HEIC на Windows, CSV).
 */
export function uploadErrors(purpose: UploadPurpose, contentType: string, size: number): FieldError[] {
  const rules = UPLOAD_RULES[purpose];
  const errors: FieldError[] = [];
  if (!(contentType.toLowerCase() in rules.types)) {
    errors.push({ field: 'contentType', code: 'invalid_value', params: { allowed: Object.keys(rules.types) } });
  }
  if (size > rules.maxBytes) errors.push({ field: 'size', code: 'out_of_range', params: { max: rules.maxBytes } });
  return errors;
}

/**
 * Ключ исходника в закрытом хранилище: `uploads/<магазин>/<загрузка>.<расширение>`. Имя файла от пользователя
 * в ключ не идёт (кириллица, пробелы, «../») — оно хранится в базе для истории импорта.
 */
export function uploadKey(shopId: string, uploadId: string, purpose: UploadPurpose, contentType: string): string {
  const ext = UPLOAD_RULES[purpose].types[contentType.toLowerCase()] ?? 'bin';
  return `uploads/${shopId}/${uploadId}.${ext}`;
}
