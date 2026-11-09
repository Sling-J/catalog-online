import { zListProductsQuery, zLoginBody } from '@catalog/contract/zod';
import type { ListProductsData, LoginData } from '@catalog/contract';
import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../test/helpers/app.js';
import { AppError } from './errors/index.js';
import { RateLimit } from './rate-limit/index.js';

/** Служебные маршруты: проверяем конвейер core (ошибки, проверка, guards) без модулей. */
@Controller('test')
class ProbeController {
  @Get('app-error')
  appError(): never {
    throw new AppError('category_has_children', 409, { extra: { categoryId: 'c1' } });
  }

  @Get('crash')
  crash(): never {
    throw new Error('secret details');
  }

  @Post('login')
  // не `login`: метод с именем операции контракта сверялся бы со схемой её ответа
  echoLogin(@Body({ schema: zLoginBody }) body: LoginData['body']) {
    return { email: body.email };
  }

  @Get('products')
  products(@Query({ schema: zListProductsQuery }) query: ListProductsData['query']) {
    return query;
  }

  /** Имя операции контракта — ответ сверяется со схемой `getProductCounts`. */
  @Get('counts')
  getProductCounts() {
    return { all: 1, noPhoto: 0, outOfStock: 0, hidden: 0, internal: 'утечка' };
  }

  @Post('limited')
  @RateLimit(2, 60_000)
  limited() {
    return { ok: true };
  }
}

const PROBLEM_JSON = /^application\/problem\+json/;

describe('core', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp({ controllers: [ProbeController] });
  });
  afterAll(async () => {
    await t?.close();
  });

  it('GET /health — API видит базу', async () => {
    const res = await t.http().get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('неизвестный адрес — 404 not_found в problem+json', async () => {
    const res = await t.http().get('/v1/nope').expect(404);
    expect(res.headers['content-type']).toMatch(PROBLEM_JSON);
    expect(res.body).toEqual({ type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found' });
  });

  it('AppError — свой статус, код и дополнительные поля', async () => {
    const res = await t.http().get('/test/app-error').expect(409);
    expect(res.body).toEqual({
      type: 'about:blank',
      title: 'Conflict',
      status: 409,
      code: 'category_has_children',
      categoryId: 'c1',
    });
  });

  it('ответ не по контракту (лишнее поле) — 500 в разработке и тестах', async () => {
    const res = await t.http().get('/test/counts').expect(500);
    expect(res.body.code).toBe('internal_error');
  });

  it('неожиданное исключение — 500 internal_error без деталей', async () => {
    const res = await t.http().get('/test/crash').expect(500);
    expect(res.body.code).toBe('internal_error');
    expect(JSON.stringify(res.body)).not.toContain('secret');
  });

  describe('X-Requested-With', () => {
    it('изменяющий запрос без заголовка — 403 forbidden', async () => {
      const res = await t.http().post('/test/login').send({ email: 'a@b.kz', password: 'x' }).expect(403);
      expect(res.body.code).toBe('forbidden');
    });

    it('с заголовком — проходит', async () => {
      const res = await t
        .http()
        .post('/test/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'a@b.kz', password: 'x' })
        .expect(201);
      expect(res.body).toEqual({ email: 'a@b.kz' });
    });
  });

  describe('проверка по схемам контракта', () => {
    it('тело с ошибками — 422 validation_failed с errors[] по полям', async () => {
      const res = await t
        .http()
        .post('/test/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .send({ email: 'not-an-email' })
        .expect(422);
      expect(res.headers['content-type']).toMatch(PROBLEM_JSON);
      expect(res.body.code).toBe('validation_failed');
      expect(res.body.errors).toEqual([
        { field: 'email', code: 'invalid_format' },
        { field: 'password', code: 'required' },
      ]);
    });

    it('битый JSON — 400 bad_request', async () => {
      const res = await t
        .http()
        .post('/test/login')
        .set('X-Requested-With', 'XMLHttpRequest')
        .set('Content-Type', 'application/json')
        .send('{"email":')
        .expect(400);
      expect(res.headers['content-type']).toMatch(PROBLEM_JSON);
      expect(res.body.code).toBe('bad_request');
    });

    it('параметры адреса приводятся к типам схемы, умолчания подставляются', async () => {
      const res = await t.http().get('/test/products?limit=5&q=123').expect(200);
      expect(res.body).toEqual({ limit: 5, q: '123', filter: 'all', sort: 'new' });
    });

    it('неверный параметр адреса — 422 по полю', async () => {
      const res = await t.http().get('/test/products?limit=abc&filter=nope').expect(422);
      expect(res.body.errors).toEqual([
        { field: 'filter', code: 'invalid_value' },
        { field: 'limit', code: 'invalid_type' },
      ]);
    });
  });

  it('ограничение частоты — 429 rate_limited с Retry-After', async () => {
    const send = () => t.http().post('/test/limited').set('X-Requested-With', 'XMLHttpRequest');
    await send().expect(201);
    await send().expect(201);
    const res = await send().expect(429);
    expect(res.body.code).toBe('rate_limited');
    expect(Number(res.headers['retry-after'])).toBeGreaterThan(0);
  });

  describe('CORS', () => {
    it('витрина на поддомене и админка разрешены, с cookie', async () => {
      for (const origin of ['http://aigerim-kids.localhost:3000', 'http://app.localhost:3002']) {
        const res = await t
          .http()
          .options('/test/login')
          .set('Origin', origin)
          .set('Access-Control-Request-Method', 'POST')
          .set('Access-Control-Request-Headers', 'content-type,x-requested-with');
        expect(res.headers['access-control-allow-origin']).toBe(origin);
        expect(res.headers['access-control-allow-credentials']).toBe('true');
      }
    });

    it('чужой адрес — без разрешения', async () => {
      const res = await t.http().get('/health').set('Origin', 'http://evil.example');
      expect(res.headers['access-control-allow-origin']).toBeUndefined();
    });
  });

  it('id запроса: свой из X-Request-Id или новый', async () => {
    const own = await t.http().get('/health').set('X-Request-Id', 'req-42');
    expect(own.headers['x-request-id']).toBe('req-42');
    const fresh = await t.http().get('/health');
    expect(fresh.headers['x-request-id']).toMatch(/^[0-9a-f-]{36}$/);
  });
});
