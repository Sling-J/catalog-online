import { RequestMethod } from '@nestjs/common';
import { HTTP_CODE_METADATA, METHOD_METADATA, PATH_METADATA } from '@nestjs/common/constants.js';
import { ModulesContainer } from '@nestjs/core';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { contractOperations } from '../../../test/helpers/contract.js';

/** Маршруты вне контракта — служебные. */
const SERVICE_ROUTES = new Set(['GET /health']);

type Route = { key: string; handler: string; success: number };

const joinPath = (...parts: (string | undefined)[]) =>
  `/${parts
    .flatMap((part) => (part ?? '').split('/'))
    .filter(Boolean)
    .join('/')}`;

/** Маршруты приложения из метаданных Nest: метод, путь, имя метода контроллера и успешный код. */
function appRoutes(t: TestApp): Route[] {
  const routes: Route[] = [];
  for (const module of t.app.get(ModulesContainer).values()) {
    for (const wrapper of module.controllers.values()) {
      const controller = wrapper.metatype as (new (...args: never[]) => object) | null;
      if (!controller) continue;
      const base = Reflect.getMetadata(PATH_METADATA, controller) as string | undefined;
      const proto = controller.prototype as Record<string, unknown>;
      for (const name of Object.getOwnPropertyNames(proto)) {
        const handler = proto[name];
        if (name === 'constructor' || typeof handler !== 'function') continue;
        const path = Reflect.getMetadata(PATH_METADATA, handler) as string | undefined;
        if (path === undefined) continue;
        const method = RequestMethod[Reflect.getMetadata(METHOD_METADATA, handler) as RequestMethod];
        const code = Reflect.getMetadata(HTTP_CODE_METADATA, handler) as number | undefined;
        routes.push({
          key: `${method} ${joinPath(base, path)}`,
          handler: name,
          success: code ?? (method === 'POST' ? 201 : 200),
        });
      }
    }
  }
  return routes;
}

describe('маршруты по контракту (T-413)', () => {
  let t: TestApp;
  let routes: Route[];

  beforeAll(async () => {
    t = await createTestApp();
    routes = appRoutes(t);
  });
  afterAll(async () => {
    await t?.close();
  });

  it('каждая операция openapi.yaml есть в приложении, лишних маршрутов нет', () => {
    const contract = contractOperations().map((op) => `${op.method} ${op.path}`);
    const app = routes.map((route) => route.key).filter((key) => !SERVICE_ROUTES.has(key));
    expect(app.filter((key) => !contract.includes(key)).sort(), 'маршруты вне контракта').toEqual([]);
    expect(contract.filter((key) => !app.includes(key)).sort(), 'операции без маршрута').toEqual([]);
    expect(new Set(app).size, 'повтор маршрута').toBe(app.length);
  });

  it('метод контроллера назван как operationId, успешный код объявлен в контракте', () => {
    const problems = contractOperations().flatMap((op) => {
      const route = routes.find((entry) => entry.key === `${op.method} ${op.path}`);
      if (!route) return [];
      const errors: string[] = [];
      if (route.handler !== op.operationId) errors.push(`${op.operationId}: метод контроллера ${route.handler}`);
      if (!op.codes.has(route.success)) {
        errors.push(`${op.operationId}: успешный код ${route.success}, в контракте ${[...op.codes].join(', ')}`);
      }
      return errors;
    });
    expect(problems).toEqual([]);
  });
});
