import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { signUp, XRW } from '../../../test/helpers/session.js';

/**
 * Импорт на настоящей очереди pg-boss (остальные тесты импорта — на очереди в памяти): задачи ставятся из
 * транзакций, в том числе из обработчика другой задачи (чтение файла ставит проверку строк).
 */
describe('импорт на pg-boss', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp({ realJobs: true });
  });
  afterAll(async () => {
    await t?.close();
  });

  it('файл → проверка → применение проходят сами, без ручного запуска задач', async () => {
    const { agent } = await signUp(t, 'queue@example.com');
    const file = Buffer.from(
      ['Артикул;Название;Цена;Остаток', 'A-1;Куртка;18900;3', 'A-2;Платье;5000;1', ''].join('\n'),
      'utf8',
    );
    const upload = await agent
      .post('/v1/admin/uploads')
      .set(XRW)
      .send({ purpose: 'import', fileName: 'ostatki.csv', contentType: 'text/csv', size: file.length })
      .expect(201);
    t.storage.upload(new URL(upload.body.url).pathname.replace(/^\/catalog-private\//, ''), file, 'text/csv');
    const created = await agent.post('/v1/admin/imports').set(XRW).send({ uploadId: upload.body.uploadId }).expect(202);

    /** pg-boss опрашивает очередь раз в 2 секунды. */
    const waitFor = async (status: string) => {
      const started = Date.now();
      for (;;) {
        const { body } = await agent.get(`/v1/admin/imports/${created.body.id}`).expect(200);
        if (body.status === status) return body;
        if (body.status === 'failed' || Date.now() - started > 25_000) {
          throw new Error(`Ждали ${status}, импорт: ${JSON.stringify(body)}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    };

    expect((await waitFor('previewed')).preview).toMatchObject({ rows: 2, create: 2, errors: 0 });
    await agent.post(`/v1/admin/imports/${created.body.id}/apply`).set(XRW).send({ zeroMissing: true }).expect(202);
    expect((await waitFor('done')).result).toEqual({ created: 2, updated: 0, zeroed: 0, skipped: 0 });
    const products = await agent.get('/v1/admin/products').expect(200);
    expect(products.body.total).toBe(2);
  }, 60_000);
});
