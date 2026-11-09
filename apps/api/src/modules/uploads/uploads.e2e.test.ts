import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { signUp, XRW, type Browser } from '../../../test/helpers/session.js';
import { UploadsService } from './uploads.service.js';

const PHOTO = { purpose: 'product_photo', fileName: 'Куртка (1).HEIC', contentType: 'image/heic', size: 2_000_000 };

describe('загрузки', () => {
  let t: TestApp;
  let uploads: UploadsService;

  beforeAll(async () => {
    t = await createTestApp();
    uploads = t.app.get(UploadsService);
  });
  afterAll(async () => {
    await t?.close();
  });

  const create = (agent: Browser, body: object) => agent.post('/v1/admin/uploads').set(XRW).send(body);
  /** Ключ в хранилище из выданной ссылки (в ответе его нет — только адрес). */
  const keyOf = (url: string) => new URL(url).pathname.replace(/^\/catalog-private\//, '');

  it('без сессии — 401', async () => {
    await request(t.app.getHttpServer()).post('/v1/admin/uploads').set(XRW).send(PHOTO).expect(401);
  });

  it('ссылка на PUT в закрытое хранилище, тип — в заголовках, ключ без имени файла', async () => {
    const { agent, me } = await signUp(t, 'link@example.com');
    const res = await create(agent, PHOTO).expect(201);
    expect(res.body).toMatchObject({ method: 'PUT', headers: { 'Content-Type': 'image/heic' } });
    expect(res.body.uploadId).toMatch(/^[0-9a-f-]{36}$/);
    expect(keyOf(res.body.url)).toBe(`uploads/${me.shop.id}/${res.body.uploadId}.heic`);
    expect(Date.parse(res.body.expiresAt) - Date.now()).toBeGreaterThan(9 * 60_000);
  });

  it('тип не по назначению и размер больше разрешённого — 422 по полям', async () => {
    const { agent } = await signUp(t, 'rules@example.com');
    const pdf = await create(agent, { ...PHOTO, contentType: 'application/pdf' }).expect(422);
    expect(pdf.body.errors).toEqual([
      { field: 'contentType', code: 'invalid_value', params: { allowed: expect.arrayContaining(['image/jpeg']) } },
    ]);
    const big = await create(agent, { ...PHOTO, size: 16 * 1024 * 1024 }).expect(422);
    expect(big.body.errors).toEqual([{ field: 'size', code: 'out_of_range', params: { max: 15 * 1024 * 1024 } }]);

    // фото нельзя выдать за импорт и наоборот
    await create(agent, { ...PHOTO, purpose: 'import' }).expect(422);
    await create(agent, {
      purpose: 'import',
      fileName: 'ostatki.csv',
      contentType: 'text/csv',
      size: 19_000_000,
    }).expect(201);
  });

  describe('принять загрузку (для логотипа, фото, импорта)', () => {
    it('файл лежит в хранилище — принимается один раз', async () => {
      const { agent, me } = await signUp(t, 'consume@example.com');
      const { body } = await create(agent, PHOTO).expect(201);
      t.storage.upload(keyOf(body.url), PHOTO.size);

      const consumed = await uploads.consume(me.shop.id, body.uploadId, 'product_photo');
      expect(consumed).toMatchObject({ fileName: PHOTO.fileName, contentType: 'image/heic', size: PHOTO.size });
      await expect(uploads.consume(me.shop.id, body.uploadId, 'product_photo')).rejects.toMatchObject({
        code: 'upload_not_found',
        status: 422,
      });
    });

    it('файл не загружен или другого размера — upload_not_found', async () => {
      const { agent, me } = await signUp(t, 'missing@example.com');
      const missing = (await create(agent, PHOTO).expect(201)).body;
      await expect(uploads.consume(me.shop.id, missing.uploadId, 'product_photo')).rejects.toMatchObject({
        code: 'upload_not_found',
      });

      const truncated = (await create(agent, PHOTO).expect(201)).body;
      t.storage.upload(keyOf(truncated.url), 100);
      await expect(uploads.consume(me.shop.id, truncated.uploadId, 'product_photo')).rejects.toMatchObject({
        code: 'upload_not_found',
      });
    });

    it('чужой магазин и другое назначение — upload_not_found', async () => {
      const owner = await signUp(t, 'owner@example.com');
      const stranger = await signUp(t, 'stranger@example.com');
      const { body } = await create(owner.agent, PHOTO).expect(201);
      t.storage.upload(keyOf(body.url), PHOTO.size);

      await expect(uploads.consume(stranger.me.shop.id, body.uploadId, 'product_photo')).rejects.toMatchObject({
        code: 'upload_not_found',
      });
      await expect(uploads.consume(owner.me.shop.id, body.uploadId, 'logo')).rejects.toMatchObject({
        code: 'upload_not_found',
      });
      // а своим и по назначению — принимается
      await uploads.consume(owner.me.shop.id, body.uploadId, 'product_photo');
    });
  });
});
