import { describe, expect, it } from 'vitest';

import { fieldErrors, isUnauthorized, problemCode, statusOf } from '../api-error';

describe('ошибки API', () => {
  const problem = { status: 422, code: 'validation_failed', errors: [{ field: 'password', code: 'too_short' }] };

  it('читает статус, код и ошибки полей из Problem', () => {
    expect(statusOf(problem)).toBe(422);
    expect(problemCode(problem)).toBe('validation_failed');
    expect(fieldErrors(problem)).toEqual({ password: 'too_short' });
  });

  it('не падает на ошибках не от API', () => {
    const network = new TypeError('Failed to fetch');
    expect(statusOf(network)).toBeUndefined();
    expect(problemCode(network)).toBeUndefined();
    expect(fieldErrors(network)).toEqual({});
    expect(isUnauthorized({ status: 401 })).toBe(true);
  });
});
