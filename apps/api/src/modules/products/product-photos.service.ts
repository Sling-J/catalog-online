import type { Photo } from '@catalog/contract';
import { Injectable, Logger } from '@nestjs/common';

import { InjectDb, type Db, type DbOrTx } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { Images, ImageUnreadableError } from '../../core/images/index.js';
import { Jobs, type JobAttempt } from '../../core/jobs/index.js';
import { Storage } from '../../core/storage/index.js';
import { UploadsService } from '../uploads/uploads.service.js';
import { PHOTO_LIMIT, PROCESS_PHOTO, type ProcessPhotoData } from './lib/photo-jobs.js';
import { productPhotosRepository, type ProductPhotoRow } from './product-photos.repository.js';
import { toPhoto } from './products.mapper.js';
import { productsRepository } from './products.repository.js';

/**
 * Фото товаров (FR-A4): добавление из загрузок, порядок (первое — обложка), удаление, сжатие в фоне
 * (`processing` → `ready` / `failed`).
 */
@Injectable()
export class ProductPhotosService {
  private readonly logger = new Logger('ProductPhotos');

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly images: Images,
    private readonly storage: Storage,
    private readonly jobs: Jobs,
    private readonly uploads: UploadsService,
  ) {}

  /** Добавить фото в конец. Больше 10 — 409 `photo_limit_reached`; сжатие ставится в той же транзакции. */
  async add(shopId: string, productId: string, uploadId: string): Promise<Photo> {
    const row = await this.db.transaction(async (tx) => {
      if (!(await productsRepository.findForUpdate(tx, shopId, productId))) throw new AppError('not_found', 404);
      const position = await productPhotosRepository.countForProduct(tx, shopId, productId);
      if (position >= PHOTO_LIMIT) throw new AppError('photo_limit_reached', 409);
      const [photo] = await this.attach(tx, shopId, productId, [uploadId], position);
      await productsRepository.touch(tx, shopId, productId);
      return photo!;
    });
    return toPhoto(row, (image) => this.images.toImage(image));
  }

  /**
   * Принять загрузки как фото товара с позиции `from` и поставить их сжатие. Только в транзакции: откатилась —
   * ни фото, ни задач, загрузки снова свободны.
   */
  async attach(
    tx: DbOrTx,
    shopId: string,
    productId: string,
    uploadIds: string[],
    from: number,
  ): Promise<ProductPhotoRow[]> {
    const rows: ProductPhotoRow[] = [];
    for (const [i, uploadId] of uploadIds.entries()) {
      const upload = await this.uploads.consume(shopId, uploadId, 'product_photo', tx);
      const photo = await productPhotosRepository.insert(tx, shopId, {
        productId,
        position: from + i,
        originalKey: upload.key,
      });
      await this.jobs.send(PROCESS_PHOTO, { shopId, photoId: photo.id }, tx);
      rows.push(photo);
    }
    return rows;
  }

  /** Новый порядок: ровно все фото товара, иначе 422 по `photoIds`. */
  async reorder(shopId: string, productId: string, photoIds: string[]): Promise<Photo[]> {
    const rows = await this.db.transaction(async (tx) => {
      if (!(await productsRepository.findForUpdate(tx, shopId, productId))) throw new AppError('not_found', 404);
      const current = await productPhotosRepository.listForProducts(tx, shopId, [productId]);
      const currentIds = new Set(current.map((photo) => photo.id));
      if (photoIds.length !== current.length || new Set(photoIds).size !== photoIds.length || !photoIds.every((id) => currentIds.has(id))) {
        throw new AppError('validation_failed', 422, { errors: [{ field: 'photoIds', code: 'invalid_value' }] });
      }
      for (const [position, photoId] of photoIds.entries()) {
        await productPhotosRepository.setPosition(tx, shopId, photoId, position);
      }
      await productsRepository.touch(tx, shopId, productId);
      return productPhotosRepository.listForProducts(tx, shopId, [productId]);
    }); // prettier-ignore
    return rows.map((row) => toPhoto(row, (image) => this.images.toImage(image)));
  }

  /** Удалить фото; остальные сдвигаются без пропусков. Файлы удаляются после записи в базу. */
  async delete(shopId: string, productId: string, photoId: string): Promise<void> {
    const deleted = await this.db.transaction(async (tx) => {
      if (!(await productsRepository.findForUpdate(tx, shopId, productId))) throw new AppError('not_found', 404);
      const row = await productPhotosRepository.delete(tx, shopId, productId, photoId);
      if (!row) throw new AppError('not_found', 404);
      const rest = await productPhotosRepository.listForProducts(tx, shopId, [productId]);
      for (const [position, photo] of rest.entries()) {
        if (photo.position !== position) await productPhotosRepository.setPosition(tx, shopId, photo.id, position);
      }
      await productsRepository.touch(tx, shopId, productId);
      return row;
    });
    await this.removeFiles([deleted]);
  }

  /**
   * Файлы удалённых фото: готовые размеры и исходник (решение основателя 2026-11-09, T-407 — сразу после записи,
   * ошибку хранилища только в лог).
   */
  async removeFiles(photos: ProductPhotoRow[]): Promise<void> {
    await Promise.all(
      photos.map(async (photo) => {
        if (photo.sizes && photo.width && photo.height) {
          await this.images.remove({ width: photo.width, height: photo.height, sizes: photo.sizes, originalKey: photo.originalKey });
          return;
        }
        await this.storage.delete('private', photo.originalKey).catch((error: unknown) => {
          this.logger.warn({ err: error, key: photo.originalKey }, 'Не удалось удалить исходник фото');
        });
      }),
    ); // prettier-ignore
  }

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
