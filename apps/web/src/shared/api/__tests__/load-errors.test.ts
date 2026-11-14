import { isNotFound } from '@tanstack/react-router';
import { describe, expect, it, vi } from 'vitest';

// Статус ответа ставит помощник Start; в тесте запроса Start нет — подменяем и смотрим, что статус поставлен.
const { setResponseStatus } = vi.hoisted(() => ({ setResponseStatus: vi.fn() }));
vi.mock('@tanstack/react-start/server', () => ({ setResponseStatus }));

import { isGoneError, isNotFoundData, isNotFoundError, throwFirstFailure } from '../load-errors';

const gone = { status: 410, code: 'shop_hidden', shop: { name: 'Айгерим Kids', whatsapp: '+77000000000' } };
const missing = { status: 404, code: 'not_found' };
const rejected = (reason: unknown): PromiseRejectedResult => ({ status: 'rejected', reason });
const ok: PromiseFulfilledResult<unknown> = { status: 'fulfilled', value: 1 };

const caught = (action: () => void): unknown => {
  try {
    action();
  } catch (error) {
    return error;
  }
  return undefined;
};

describe('ошибки предзагрузки', () => {
  it('различает 404 и 410', () => {
    expect(isNotFoundError(missing)).toBe(true);
    expect(isNotFoundError(gone)).toBe(false);
    expect(isGoneError(gone)).toBe(true);
    expect(isGoneError({ status: 410 })).toBe(false);
    expect(isNotFoundError(new Error('сеть'))).toBe(false);
  });

  it('без ошибок ничего не бросает', () => {
    expect(caught(() => throwFirstFailure([ok, ok]))).toBeUndefined();
  });

  it('скрытый магазин важнее остальных 404: заглушка с контактами', () => {
    const error = caught(() => throwFirstFailure([rejected(missing), rejected(gone)]));
    expect(isNotFound(error)).toBe(true);
    expect(isNotFound(error) && error.data).toMatchObject({ reason: 'shop_gone', shop: { name: 'Айгерим Kids' } });
    // страница скрытого магазина отвечает 410, как API (T-501)
    expect(setResponseStatus).toHaveBeenCalledWith(410);
  });

  it('404 товара несёт причину product, обычный 404 — без данных', () => {
    const product = caught(() => throwFirstFailure([rejected(missing)], 'product'));
    expect(isNotFound(product) && product.data).toEqual({ reason: 'product' });
    const shop = caught(() => throwFirstFailure([rejected(missing)]));
    expect(isNotFound(shop) && shop.data).toBeUndefined();
  });

  it('прочие ошибки пробрасывает как есть', () => {
    const failure = new Error('сеть пропала');
    expect(caught(() => throwFirstFailure([rejected(failure)]))).toBe(failure);
  });

  it('узнаёт данные «не найдено»', () => {
    expect(isNotFoundData({ reason: 'product' })).toBe(true);
    expect(isNotFoundData(undefined)).toBe(false);
  });
});
