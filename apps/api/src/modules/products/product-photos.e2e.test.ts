import { readFileSync } from 'node:fs';

import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import { signUp } from '../../../test/helpers/session.js';
import type { Db } from '../../core/db/index.js';
import { productPhotos, products } from '../../core/db/schema/index.js';
import { PROCESS_PHOTO } from './workers/process-photo.worker.js';

const HEIC = readFileSync(new URL('../../../test/fixtures/photo.heic', import.meta.url));

describe('обработка фото товара (фоновая задача)', () => {
  let t: TestApp;
  let db: Db;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    t = await createTestApp();
    ({ db, close: closeDb } = connectTestDb(t.config.databaseUrl));
  });
  afterAll(async () => {
    await closeDb?.();
    await t?.close();
  });

  /** Товар с фото «в обработке»; исходник — в закрытом хранилище (если передан). */
  const addPhoto = async (email: string, original: Buffer | null = HEIC) => {
    const { me } = await signUp(t, email);
    const shopId = me.shop.id;
    const [product] = await db
      .insert(products)
      .values({ shopId, name: 'Куртка', slug: 'kurtka', shortId: 'k1' })
      .returning();
    const originalKey = `uploads/${shopId}/${crypto.randomUUID()}.heic`;
    if (original) t.storage.upload(originalKey, original, 'image/heic');
    const [photo] = await db.insert(productPhotos).values({ shopId, productId: product!.id, originalKey }).returning();
    return { shopId, photoId: photo!.id };
  };
  const photo = async (photoId: string) =>
    (await db.select().from(productPhotos).where(eq(productPhotos.id, photoId)))[0];

  it('HEIC → три WebP в публичном хранилище, статус ready, стороны исходника', async () => {
    const { shopId, photoId } = await addPhoto('ready@example.com');
    await t.jobs.run(PROCESS_PHOTO, { shopId, photoId });

    const prefix = `shops/${shopId}/photos/${photoId}`;
    expect(await photo(photoId)).toMatchObject({
      status: 'ready',
      width: 400,
      height: 300,
      sizes: { '320': `${prefix}/320.webp`, '640': `${prefix}/640.webp`, '1280': `${prefix}/1280.webp` },
    });
    expect(t.storage.keys('public', prefix)).toEqual([
      `${prefix}/1280.webp`,
      `${prefix}/320.webp`,
      `${prefix}/640.webp`,
    ]);

    // повтор (pg-boss может выполнить задачу ещё раз) ничего не ломает
    await t.jobs.run(PROCESS_PHOTO, { shopId, photoId });
    expect((await photo(photoId))?.status).toBe('ready');
  });

  it('файл не картинка — сразу failed, без повторов', async () => {
    const { shopId, photoId } = await addPhoto('broken@example.com', Buffer.from('not an image'));
    await t.jobs.run(PROCESS_PHOTO, { shopId, photoId });
    expect((await photo(photoId))?.status).toBe('failed');
  });

  it('сбой хранилища — повтор; на последней попытке failed', async () => {
    const { shopId, photoId } = await addPhoto('flaky@example.com', null);
    await expect(t.jobs.run(PROCESS_PHOTO, { shopId, photoId })).rejects.toThrow();
    expect((await photo(photoId))?.status).toBe('processing');
    await expect(t.jobs.run(PROCESS_PHOTO, { shopId, photoId }, { last: true })).rejects.toThrow();
    expect((await photo(photoId))?.status).toBe('failed');
  });

  it('фото удалено или чужой магазин — задача ничего не делает', async () => {
    const { shopId, photoId } = await addPhoto('gone@example.com');
    const stranger = await signUp(t, 'stranger@example.com');
    await t.jobs.run(PROCESS_PHOTO, { shopId: stranger.me.shop.id, photoId });
    expect((await photo(photoId))?.status).toBe('processing');

    await db.delete(productPhotos).where(eq(productPhotos.id, photoId));
    await t.jobs.run(PROCESS_PHOTO, { shopId, photoId });
    expect(t.storage.keys('public', `shops/${shopId}/`)).toEqual([]);
  });
});
