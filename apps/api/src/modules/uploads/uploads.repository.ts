import { and, eq, inArray, isNull, lt } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import { uploads } from '../../core/db/schema/index.js';
import type { UploadPurpose } from './lib/upload-rules.js';

export type UploadRow = InferSelectModel<typeof uploads>;

/** Выданные ссылки на загрузку (API2). Все функции — по `shopId`. */
export const uploadsRepository = {
  async create(
    db: DbOrTx,
    shopId: string,
    row: {
      id: string;
      purpose: UploadPurpose;
      key: string;
      fileName: string;
      contentType: string;
      size: number;
      expiresAt: Date;
    },
  ): Promise<void> {
    await db.insert(uploads).values({ ...row, shopId });
  },

  /** Неиспользованная загрузка магазина нужного назначения; строка блокируется до конца транзакции. */
  async findUnusedForUpdate(
    db: DbOrTx,
    shopId: string,
    uploadId: string,
    purpose: UploadPurpose,
  ): Promise<UploadRow | null> {
    const [row] = await db
      .select()
      .from(uploads)
      .where(
        and(eq(uploads.id, uploadId), eq(uploads.shopId, shopId), eq(uploads.purpose, purpose), isNull(uploads.usedAt)),
      )
      .for('update');
    return row ?? null;
  },

  /**
   * Брошенные загрузки: не использованы, ссылка истекла раньше `before`. Системная уборка по всем магазинам —
   * поэтому без `shopId` (исключение из раздела 6).
   */
  async listAbandoned(db: DbOrTx, before: Date, limit: number): Promise<Pick<UploadRow, 'id' | 'key'>[]> {
    return db
      .select({ id: uploads.id, key: uploads.key })
      .from(uploads)
      .where(and(isNull(uploads.usedAt), lt(uploads.expiresAt, before)))
      .orderBy(uploads.expiresAt)
      .limit(limit);
  },

  /** Удалить строки брошенных загрузок (только неиспользованные — вдруг загрузку приняли, пока убирали). */
  async deleteAbandoned(db: DbOrTx, ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await db.delete(uploads).where(and(inArray(uploads.id, ids), isNull(uploads.usedAt)));
  },

  async markUsed(db: DbOrTx, shopId: string, uploadId: string, at: Date): Promise<void> {
    await db
      .update(uploads)
      .set({ usedAt: at })
      .where(and(eq(uploads.id, uploadId), eq(uploads.shopId, shopId)));
  },
};
