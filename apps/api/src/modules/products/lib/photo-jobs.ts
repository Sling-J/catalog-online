import { defineJob } from '../../../core/jobs/index.js';

export type ProcessPhotoData = { shopId: string; photoId: string };

/**
 * Сжать фото товара. Ставится вместе с записью фото, в той же транзакции (`addProductPhoto`, `createProduct`).
 * Три попытки с нарастающей паузой (10 с, 20 с…), одна попытка — не дольше 5 минут.
 */
export const PROCESS_PHOTO = defineJob<ProcessPhotoData>('photos.process', {
  retryLimit: 2,
  retryDelay: 10,
  retryBackoff: true,
  expireInSeconds: 5 * 60,
});

/** Не больше 10 фото на товар (FR-A4). */
export const PHOTO_LIMIT = 10;
