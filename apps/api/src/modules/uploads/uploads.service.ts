import { randomUUID } from 'node:crypto';

import type { CreateUploadData, Upload } from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import { InjectDb, type Db, type DbOrTx } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { Storage } from '../../core/storage/index.js';
import { UPLOAD_LINK_TTL_SEC, uploadErrors, uploadKey, type UploadPurpose } from './lib/upload-rules.js';
import { uploadsRepository } from './uploads.repository.js';

/** Загрузка, которую принял модуль-потребитель (логотип, фото, импорт): исходник лежит в закрытом хранилище. */
export type ConsumedUpload = { id: string; key: string; fileName: string; contentType: string; size: number };

/**
 * Загрузка файлов напрямую в хранилище (API2). `consume` — для других модулей: логотип и фото (T-406, T-407),
 * импорт (T-409) проверяют им `uploadId`.
 */
@Injectable()
export class UploadsService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly storage: Storage,
  ) {}

  /** Ссылка на `PUT` в закрытое хранилище; тип и размер — в подписи ссылки. */
  async create(shopId: string, body: CreateUploadData['body']): Promise<Upload> {
    const contentType = body.contentType.toLowerCase();
    const errors = uploadErrors(body.purpose, contentType, body.size);
    if (errors.length) throw new AppError('validation_failed', 422, { errors });

    const id = randomUUID();
    const key = uploadKey(shopId, id, body.purpose, contentType);
    const link = await this.storage.presignPut({
      bucket: 'private',
      key,
      contentType,
      size: body.size,
      expiresInSec: UPLOAD_LINK_TTL_SEC,
    });
    await uploadsRepository.create(this.db, shopId, {
      id,
      purpose: body.purpose,
      key,
      fileName: body.fileName,
      contentType,
      size: body.size,
      expiresAt: link.expiresAt,
    });
    return {
      uploadId: id,
      url: link.url,
      method: 'PUT',
      headers: link.headers,
      expiresAt: link.expiresAt.toISOString(),
    };
  }

  /**
   * Принять загрузку: своя, нужного назначения, ещё не использована, и файл правда лежит в хранилище того же
   * размера. Иначе — 422 `upload_not_found`. Помечается использованной в той же транзакции, что и запись
   * потребителя (передайте `tx`), — второй раз тот же `uploadId` не пройдёт.
   */
  async consume(shopId: string, uploadId: string, purpose: UploadPurpose, tx?: DbOrTx): Promise<ConsumedUpload> {
    const run = async (db: DbOrTx) => {
      const row = await uploadsRepository.findUnusedForUpdate(db, shopId, uploadId, purpose);
      if (!row) throw new AppError('upload_not_found', 422);
      const stored = await this.storage.head('private', row.key);
      if (!stored || stored.size !== row.size) throw new AppError('upload_not_found', 422);
      await uploadsRepository.markUsed(db, shopId, uploadId, new Date());
      return { id: row.id, key: row.key, fileName: row.fileName, contentType: row.contentType, size: row.size };
    };
    return tx ? run(tx) : this.db.transaction(run);
  }
}
