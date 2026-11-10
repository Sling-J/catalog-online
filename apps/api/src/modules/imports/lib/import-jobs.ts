import { defineJob } from '../../../core/jobs/index.js';

export type ImportJobData = { shopId: string; importId: string };

const RETRY = { retryLimit: 2, retryDelay: 5, retryBackoff: true };

/** Прочитать файл: заголовки, число строк, предложенное сопоставление. Ставится вместе с записью импорта. */
export const PARSE_IMPORT = defineJob<ImportJobData>('imports.parse', { ...RETRY, expireInSeconds: 5 * 60 });

/** Проверить строки по сопоставлению и посчитать предпросмотр. */
export const PREVIEW_IMPORT = defineJob<ImportJobData>('imports.preview', { ...RETRY, expireInSeconds: 10 * 60 });

/** Записать строки в каталог одной транзакцией. */
export const APPLY_IMPORT = defineJob<ImportJobData>('imports.apply', { ...RETRY, expireInSeconds: 15 * 60 });

/** Сколько первых строк отдаём для шага «Колонки». */
export const SAMPLE_ROWS = 5;
