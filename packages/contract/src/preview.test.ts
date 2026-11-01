import { describe, expect, it } from 'vitest';

import { zAdminToStorefrontMessage } from './preview.js';

describe('сообщения превью', () => {
  it('принимает правки магазина и отбрасывает поля, которые админка менять не может', () => {
    const parsed = zAdminToStorefrontMessage.parse({
      source: 'catalog-admin',
      type: 'shop-draft',
      shop: { name: 'Новое имя', subdomain: 'chuzhoj', isPreview: false },
    });
    expect(parsed).toEqual({ source: 'catalog-admin', type: 'shop-draft', shop: { name: 'Новое имя' } });
  });

  it('не принимает чужие сообщения', () => {
    expect(zAdminToStorefrontMessage.safeParse({ type: 'shop-draft', shop: {} }).success).toBe(false);
    expect(zAdminToStorefrontMessage.safeParse({ source: 'catalog-admin', type: 'drop-tables' }).success).toBe(false);
  });
});
