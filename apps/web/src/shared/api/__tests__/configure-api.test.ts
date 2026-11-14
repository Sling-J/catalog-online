import { client } from '@catalog/contract';
import { beforeAll, describe, expect, it, vi } from 'vitest';

// Токен превью берётся из адреса страницы; в тесте задаём его сами.
const { previewToken } = vi.hoisted(() => ({ previewToken: { value: undefined as string | undefined } }));
vi.mock('../preview', () => ({ PREVIEW_PARAM: 'preview', getPreviewToken: () => previewToken.value }));

import { configureApi } from '../configure-api';

type Interceptor = (request: Request, options: unknown) => Promise<Request> | Request;

const intercept = async (request: Request): Promise<Request> => {
  let result = request;
  for (const fn of client.interceptors.request.fns as (Interceptor | null)[]) {
    if (fn) result = await fn(result, {});
  }
  return result;
};

const API = 'http://localhost:3001/v1/storefront/aigerim-kids';

describe('настройка клиента витрины', () => {
  beforeAll(() => configureApi());

  it('чтение уходит без X-Requested-With — иначе перед каждым запросом браузер шлёт OPTIONS', async () => {
    previewToken.value = undefined;
    const request = await intercept(new Request(`${API}/products`));
    expect(request.headers.has('X-Requested-With')).toBe(false);
  });

  it('изменяющий запрос получает X-Requested-With (защита от CSRF)', async () => {
    previewToken.value = undefined;
    const body = JSON.stringify({ type: 'view' });
    const request = await intercept(new Request(`${API}/events`, { method: 'POST', body }));
    expect(request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    expect(await request.text()).toBe(body);
  });

  it('в превью токен попадает в адрес, тело POST сохраняется байтами, а не потоком', async () => {
    previewToken.value = 'tok';
    const body = JSON.stringify({ items: [{ variantId: 'v', quantity: 1 }] });
    const request = await intercept(
      new Request(`${API}/cart/check`, { method: 'POST', body, headers: { 'Content-Type': 'application/json' } }),
    );
    expect(new URL(request.url).searchParams.get('preview')).toBe('tok');
    expect(request.headers.get('Content-Type')).toBe('application/json');
    expect(request.headers.get('X-Requested-With')).toBe('XMLHttpRequest');
    expect(await request.text()).toBe(body);
  });

  it('токен превью не уходит в запросы не к витрине', async () => {
    previewToken.value = 'tok';
    const request = await intercept(new Request('http://localhost:3001/v1/auth/me'));
    expect(new URL(request.url).searchParams.has('preview')).toBe(false);
  });
});
