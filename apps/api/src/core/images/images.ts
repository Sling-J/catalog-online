import type { Image } from '@catalog/contract';
import { Global, Injectable, Logger, Module } from '@nestjs/common';

import { Storage, type BucketKind } from '../storage/index.js';
import { IMAGE_WIDTHS, renderImage, type ImageWidth } from './render.js';

/** Готовая картинка в базе: стороны исходника и ключи размеров в публичном хранилище. */
export type StoredImage = { width: number; height: number; sizes: Record<ImageWidth, string> };

/**
 * Готовые картинки: исходник из закрытого хранилища → три WebP в публичном (фото товаров, логотип). Ключи
 * размеров — `<prefix>/<ширина>.webp`; новый исходник — новый `prefix`, поэтому файлы кешируются навсегда.
 */
@Injectable()
export class Images {
  private readonly logger = new Logger('Images');

  constructor(private readonly storage: Storage) {}

  /** Сжать и выложить. Не открылось — `ImageUnreadableError`; ошибки хранилища — как есть (повторить можно). */
  async publish(originalKey: string, prefix: string): Promise<StoredImage> {
    const rendered = await renderImage(await this.storage.get('private', originalKey));
    const sizes = {} as Record<ImageWidth, string>;
    for (const size of IMAGE_WIDTHS) {
      sizes[size] = `${prefix}/${size}.webp`;
      await this.storage.put('public', sizes[size], rendered.variants[size], 'image/webp');
    }
    return { width: rendered.width, height: rendered.height, sizes };
  }

  /**
   * Удалить готовые размеры и, если передан `originalKey`, исходник. Ошибку хранилища только пишем в лог — запись
   * в базе к этому времени уже изменена.
   */
  async remove(image: StoredImage & { originalKey?: string }): Promise<void> {
    const files: { bucket: BucketKind; key: string }[] = IMAGE_WIDTHS.map((size) => ({
      bucket: 'public',
      key: image.sizes[size],
    }));
    if (image.originalKey) files.push({ bucket: 'private', key: image.originalKey });
    await Promise.all(
      files.map(({ bucket, key }) =>
        this.storage.delete(bucket, key).catch((error: unknown) => {
          this.logger.warn({ err: error, bucket, key }, 'Не удалось удалить файл картинки');
        }),
      ),
    );
  }

  /** Для ответа API: адреса вместо ключей. */
  toImage(image: StoredImage): Image {
    return {
      width: image.width,
      height: image.height,
      sizes: {
        '320': this.storage.publicUrl(image.sizes['320']),
        '640': this.storage.publicUrl(image.sizes['640']),
        '1280': this.storage.publicUrl(image.sizes['1280']),
      },
    };
  }
}

@Global()
@Module({ providers: [Images], exports: [Images] })
export class ImagesModule {}
