/** Фото товара (FR-A4, контракт `createUpload`): до 10 на товар, каждое до 15 МБ. */
export const PHOTO_LIMIT = 10;
export const PHOTO_MAX_BYTES = 15 * 1024 * 1024;
/** Что предлагать в выборе файла; расширения — для HEIC, у которого браузер на Windows не знает тип. */
export const PHOTO_ACCEPT = 'image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif';
/** Как часто перечитывать товар, пока фото сжимаются. */
export const PHOTO_POLL_MS = 2000;
