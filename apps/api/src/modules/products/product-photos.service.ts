import { Injectable } from '@nestjs/common';

import { InjectDb, type Db } from '../../core/db/index.js';
import { Images, ImageUnreadableError } from '../../core/images/index.js';
import type { JobAttempt } from '../../core/jobs/index.js';
import { productPhotosRepository } from './product-photos.repository.js';

export type ProcessPhotoData = { shopId: string; photoId: string };

/**
 * Фото товаров (FR-A4). Пока — только обработка в фоне (T-406): исходник из закрытого хранилища → три WebP в
 * публичном, статус `processing` → `ready` / `failed`. Добавление, порядок и удаление — T-407.
 */
@Injectable()
export class ProductPhotosService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly images: Images,
  ) {}

  /**
   * Обработать фото. Повтор безопасен: обработанное, сломанное или удалённое фото пропускается. Файл не
   * открывается — сразу `failed` (повтор не поможет); другая ошибка — повтор, на последней попытке `failed`.
   */
  async process({ shopId, photoId }: ProcessPhotoData, attempt: JobAttempt): Promise<void> {
    const photo = await productPhotosRepository.find(this.db, shopId, photoId);
    if (!photo || photo.status !== 'processing') return;
    try {
      const image = await this.images.publish(photo.originalKey, `shops/${shopId}/photos/${photoId}`);
      const updated = await productPhotosRepository.markReady(this.db, shopId, photoId, image);
      // фото удалили, пока сжимали, — готовые размеры не нужны
      if (!updated) await this.images.remove(image);
    } catch (error) {
      const unreadable = error instanceof ImageUnreadableError;
      if (unreadable || attempt.last) await productPhotosRepository.markFailed(this.db, shopId, photoId);
      if (!unreadable) throw error;
    }
  }
}
