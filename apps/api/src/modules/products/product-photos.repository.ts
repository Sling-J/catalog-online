import { and, asc, count, eq, inArray } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { productPhotos } from '../../core/db/schema/index.js';
import type { StoredImage } from '../../core/images/index.js';

export type ProductPhotoRow = InferSelectModel<typeof productPhotos>;

/** Фото товаров (FR-A4). Все функции — по `shopId`. */
export const productPhotosRepository = {
  async listForProducts(db: DbOrTx, shopId: string, productIds: string[]): Promise<ProductPhotoRow[]> {
    if (productIds.length === 0) return [];
    return db
      .select()
      .from(productPhotos)
      .where(and(eq(productPhotos.shopId, shopId), inArray(productPhotos.productId, productIds)))
      .orderBy(asc(productPhotos.position), asc(productPhotos.id));
  },

  async countForProduct(db: DbOrTx, shopId: string, productId: string): Promise<number> {
    const [row] = await db
      .select({ total: count() })
      .from(productPhotos)
      .where(and(eq(productPhotos.shopId, shopId), eq(productPhotos.productId, productId)));
    return row?.total ?? 0;
  },

  async insert(
    db: DbOrTx,
    shopId: string,
    row: { productId: string; position: number; originalKey: string },
  ): Promise<ProductPhotoRow> {
    const [created] = await db
      .insert(productPhotos)
      .values({ ...row, shopId })
      .returning();
    return created!;
  },

  async setPosition(db: DbOrTx, shopId: string, photoId: string, position: number): Promise<void> {
    await db
      .update(productPhotos)
      .set({ position })
      .where(and(eq(productPhotos.id, photoId), eq(productPhotos.shopId, shopId)));
  },

  /** Удалить фото товара; вернуть удалённое (для файлов) или `null`. */
  async delete(db: DbOrTx, shopId: string, productId: string, photoId: string): Promise<ProductPhotoRow | null> {
    const [row] = await db
      .delete(productPhotos)
      .where(
        and(eq(productPhotos.id, photoId), eq(productPhotos.shopId, shopId), eq(productPhotos.productId, productId)),
      )
      .returning();
    return row ?? null;
  },

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
