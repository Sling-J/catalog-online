import type { Config } from '../../src/core/config/index.js';
import { Storage, type BucketKind, type PresignedPut, type StoredObject } from '../../src/core/storage/index.js';

type Stored = { body: Buffer; contentType: string };

/**
 * Хранилище e2e в памяти (backend-structure.md, раздел 11: внешнее — подменой провайдера). Ссылки фиктивные;
 * «загрузку из браузера» тест делает сам — `upload(key, size)`.
 */
export class MemoryStorage extends Storage {
  readonly files = new Map<string, Stored>();

  constructor(config: Config['s3']) {
    super(config);
  }

  async presignPut(input: {
    bucket: BucketKind;
    key: string;
    contentType: string;
    size: number;
    expiresInSec: number;
  }): Promise<PresignedPut> {
    return {
      url: `${this.config.endpoint}/${this.bucketName(input.bucket)}/${input.key}?signed`,
      headers: { 'Content-Type': input.contentType },
      expiresAt: new Date(Date.now() + input.expiresInSec * 1000),
    };
  }

  async head(bucket: BucketKind, key: string): Promise<StoredObject | null> {
    const file = this.files.get(`${bucket}/${key}`);
    return file ? { size: file.body.length, contentType: file.contentType } : null;
  }

  async get(bucket: BucketKind, key: string): Promise<Buffer> {
    const file = this.files.get(`${bucket}/${key}`);
    if (!file) throw new Error(`Нет файла ${bucket}/${key}`);
    return file.body;
  }

  async put(bucket: BucketKind, key: string, body: Buffer, contentType: string): Promise<void> {
    this.files.set(`${bucket}/${key}`, { body, contentType });
  }

  async delete(bucket: BucketKind, key: string): Promise<void> {
    this.files.delete(`${bucket}/${key}`);
  }

  /** Как будто браузер отправил файл по ссылке из `createUpload`. */
  upload(key: string, size: number, contentType = 'image/jpeg'): void {
    this.files.set(`private/${key}`, { body: Buffer.alloc(size), contentType });
  }
}
