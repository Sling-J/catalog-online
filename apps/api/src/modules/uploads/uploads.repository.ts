import { and, eq, isNull } from 'drizzle-orm';
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

  async markUsed(db: DbOrTx, shopId: string, uploadId: string, at: Date): Promise<void> {
    await db
      .update(uploads)
      .set({ usedAt: at })
      .where(and(eq(uploads.id, uploadId), eq(uploads.shopId, shopId)));
  },
};
