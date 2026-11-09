import { and, eq } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { productPhotos } from '../../core/db/schema/index.js';
import type { StoredImage } from '../../core/images/index.js';

export type ProductPhotoRow = InferSelectModel<typeof productPhotos>;

/** Фото товаров (FR-A4). Все функции — по `shopId`. */
export const productPhotosRepository = {
  async find(db: DbOrTx, shopId: string, photoId: string): Promise<ProductPhotoRow | null> {
    const [row] = await db
      .select()
      .from(productPhotos)
      .where(and(eq(productPhotos.id, photoId), eq(productPhotos.shopId, shopId)));
    return row ?? null;
  },

  /** Готово — только если фото ещё ждёт обработки (не удалено и не обработано параллельно). */
  async markReady(db: DbOrTx, shopId: string, photoId: string, image: StoredImage): Promise<boolean> {
    const rows = await db
      .update(productPhotos)
      .set({ status: 'ready', sizes: image.sizes, width: image.width, height: image.height })
      .where(
        and(eq(productPhotos.id, photoId), eq(productPhotos.shopId, shopId), eq(productPhotos.status, 'processing')),
      )
      .returning({ id: productPhotos.id });
    return rows.length > 0;
  },

  async markFailed(db: DbOrTx, shopId: string, photoId: string): Promise<void> {
    await db
      .update(productPhotos)
      .set({ status: 'failed' })
      .where(
        and(eq(productPhotos.id, photoId), eq(productPhotos.shopId, shopId), eq(productPhotos.status, 'processing')),
      );
  },
};
