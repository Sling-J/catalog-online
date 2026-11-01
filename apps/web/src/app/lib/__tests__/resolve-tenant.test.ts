import { describe, expect, it } from 'vitest';

import { resolveTenant } from '../resolve-tenant';

describe('resolveTenant', () => {
  it('основной домен и www — лендинг', () => {
    expect(resolveTenant('example.kz', 'example.kz')).toEqual({ kind: 'landing' });
    expect(resolveTenant('www.example.kz', 'example.kz')).toEqual({ kind: 'landing' });
    expect(resolveTenant('localhost:3000', 'localhost')).toEqual({ kind: 'landing' });
  });

  it('поддомен — витрина магазина, порт и регистр игнорируются', () => {
    expect(resolveTenant('aigerim-kids.example.kz', 'example.kz')).toEqual({ kind: 'shop', subdomain: 'aigerim-kids' });
    expect(resolveTenant('Aigerim-Kids.localhost:3000', 'localhost')).toEqual({
      kind: 'shop',
      subdomain: 'aigerim-kids',
    });
  });

  it('служебные поддомены, вложенные поддомены и чужие адреса — unknown', () => {
    expect(resolveTenant('app.example.kz', 'example.kz')).toEqual({ kind: 'unknown' });
    expect(resolveTenant('api.example.kz', 'example.kz')).toEqual({ kind: 'unknown' });
    expect(resolveTenant('a.b.example.kz', 'example.kz')).toEqual({ kind: 'unknown' });
    expect(resolveTenant('-bad.example.kz', 'example.kz')).toEqual({ kind: 'unknown' });
    expect(resolveTenant('evilexample.kz', 'example.kz')).toEqual({ kind: 'unknown' });
    expect(resolveTenant('127.0.0.1:3000', 'localhost')).toEqual({ kind: 'unknown' });
    expect(resolveTenant(undefined, 'example.kz')).toEqual({ kind: 'unknown' });
  });
});
