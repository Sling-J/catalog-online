import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { XRW } from '../../../test/helpers/session.js';

/**
 * Неверное тело запросов входа — 422 по полям (контракт, T-413). Отдельное приложение: у этих запросов строгие
 * лимиты частоты, и `auth.e2e.test.ts` их тратить не должен.
 */
describe('вход: проверка тела запроса', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });

  const post = (path: string, body: object) => t.http().post(`/v1/auth/${path}`).set(XRW).send(body);

  it('вход, подтверждение почты и «Забыли пароль» — 422 с полем', async () => {
    expect((await post('login', { email: 'не почта', password: 'x' }).expect(422)).body.errors).toEqual([
      { field: 'email', code: 'invalid_format' },
    ]);
    expect((await post('email/verify', {}).expect(422)).body.errors).toEqual([{ field: 'token', code: 'required' }]);
    expect((await post('password/forgot', { email: 42 }).expect(422)).body.errors).toEqual([
      { field: 'email', code: 'invalid_type' },
    ]);
  });
});
