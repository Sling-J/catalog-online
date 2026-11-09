import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { XRW } from '../../../test/helpers/session.js';

const ANY_ID = '0192d000-0000-7000-8000-00000000ffff';

/** Маршруты без входа. Всё остальное приложение отдаёт только вошедшему магазину — новый маршрут попадает сюда сам. */
const PUBLIC = new Set([
  'GET /health',
  'POST /v1/auth/register',
  'POST /v1/auth/login',
  'POST /v1/auth/email/verify',
  'POST /v1/auth/password/forgot',
  'POST /v1/auth/password/reset',
]);

type Layer = { route?: { path: string; methods: Record<string, boolean> } };

describe('вход обязателен', () => {
  let t: TestApp;
  let routes: { method: string; path: string }[];

  beforeAll(async () => {
    t = await createTestApp();
    const stack = t.app.getHttpAdapter().getInstance().router.stack as unknown as Layer[];
    routes = stack.flatMap((layer) =>
      layer.route && !layer.route.path.includes('*')
        ? Object.keys(layer.route.methods).map((method) => ({ method: method.toUpperCase(), path: layer.route!.path }))
        : [],
    );
  });
  afterAll(async () => {
    await t?.close();
  });

  it('маршруты найдены, публичные — все существуют', () => {
    const keys = new Set(routes.map((route) => `${route.method} ${route.path}`));
    expect(routes.length).toBeGreaterThanOrEqual(40);
    for (const key of PUBLIC) expect(keys, key).toContain(key);
  });

  it('каждый закрытый маршрут без сессии и с поддельной cookie — 401 unauthorized, до проверки тела', async () => {
    const closed = routes.filter((route) => !PUBLIC.has(`${route.method} ${route.path}`));
    for (const route of closed) {
      const url = route.path.replace(/:\w+/g, ANY_ID);
      for (const cookie of [undefined, 'sid=forged']) {
        const req = t.http()[route.method.toLowerCase() as 'get'](url).set(XRW);
        if (cookie) req.set('Cookie', cookie);
        const res = await req.send({});
        expect({ route: `${route.method} ${route.path}`, status: res.status, code: res.body.code }).toEqual({
          route: `${route.method} ${route.path}`,
          status: 401,
          code: 'unauthorized',
        });
      }
    }
  });
});
