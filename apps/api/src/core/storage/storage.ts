import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  NotFound,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

import type { Config } from '../config/index.js';

/** Какое из двух хранилищ (решение основателя 2026-11-09, T-405): публичное — готовые картинки, закрытое — остальное. */
export type BucketKind = 'public' | 'private';

export type PresignedPut = {
  url: string;
  /** Отправить с `PUT` как есть — они вошли в подпись. */
  headers: Record<string, string>;
  expiresAt: Date;
};

export type StoredObject = { size: number; contentType: string | undefined };

/**
 * Файлы в S3-совместимом хранилище (backend-structure.md, раздел 3). Внедряется как `Storage`; в e2e подменяется
 * хранилищем в памяти (`test/helpers/storage.ts`).
 */
export abstract class Storage {
  constructor(protected readonly config: Config['s3']) {}

  /**
   * Ссылка для прямой загрузки из браузера (API2). Тип и размер входят в подпись: файл другого типа или длины
   * хранилище не примет (403).
   */
  abstract presignPut(input: {
    bucket: BucketKind;
    key: string;
    contentType: string;
    size: number;
    expiresInSec: number;
  }): Promise<PresignedPut>;

  /** Есть ли файл и какой он; нет — `null`. */
  abstract head(bucket: BucketKind, key: string): Promise<StoredObject | null>;

  abstract get(bucket: BucketKind, key: string): Promise<Buffer>;

  abstract put(bucket: BucketKind, key: string, body: Buffer, contentType: string): Promise<void>;

  abstract delete(bucket: BucketKind, key: string): Promise<void>;

  /** Постоянный адрес файла публичного хранилища для покупателя. */
  publicUrl(key: string): string {
    return `${this.config.publicUrl}/${key.split('/').map(encodeURIComponent).join('/')}`;
  }

  protected bucketName(bucket: BucketKind): string {
    return bucket === 'public' ? this.config.publicBucket : this.config.privateBucket;
  }
}

/** Готовые картинки не меняются (новая — новый ключ), поэтому кешируются надолго. */
const PUBLIC_CACHE_CONTROL = 'public, max-age=31536000, immutable';

export class S3Storage extends Storage {
  readonly client: S3Client;

  constructor(config: Config['s3']) {
    super(config);
    this.client = new S3Client({
      endpoint: config.endpoint,
      region: config.region,
      // адрес вида <endpoint>/<хранилище>/<ключ> — так работают SeaweedFS, MinIO и большинство S3-провайдеров
      forcePathStyle: true,
      credentials: { accessKeyId: config.accessKey, secretAccessKey: config.secretKey },
    });
  }

  async presignPut(input: {
    bucket: BucketKind;
    key: string;
    contentType: string;
    size: number;
    expiresInSec: number;
  }): Promise<PresignedPut> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName(input.bucket),
      Key: input.key,
      ContentType: input.contentType,
      ContentLength: input.size,
    });
    const url = await getSignedUrl(this.client, command, {
      expiresIn: input.expiresInSec,
      signableHeaders: new Set(['content-type', 'content-length']),
    });
    // Content-Length браузер ставит сам по телу запроса — передавать его нельзя
    return {
      url,
      headers: { 'Content-Type': input.contentType },
      expiresAt: new Date(Date.now() + input.expiresInSec * 1000),
    };
  }

  async head(bucket: BucketKind, key: string): Promise<StoredObject | null> {
    try {
      const res = await this.client.send(new HeadObjectCommand({ Bucket: this.bucketName(bucket), Key: key }));
      return { size: res.ContentLength ?? 0, contentType: res.ContentType };
    } catch (error) {
      if (error instanceof NotFound || (error as { name?: string }).name === 'NotFound') return null;
      throw error;
    }
  }

  async get(bucket: BucketKind, key: string): Promise<Buffer> {
    const res = await this.client.send(new GetObjectCommand({ Bucket: this.bucketName(bucket), Key: key }));
    return Buffer.from(await res.Body!.transformToByteArray());
  }

  async put(bucket: BucketKind, key: string, body: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucketName(bucket),
        Key: key,
        Body: body,
        ContentType: contentType,
        ...(bucket === 'public' ? { CacheControl: PUBLIC_CACHE_CONTROL } : {}),
      }),
    );
  }

  async delete(bucket: BucketKind, key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucketName(bucket), Key: key }));
  }
}
