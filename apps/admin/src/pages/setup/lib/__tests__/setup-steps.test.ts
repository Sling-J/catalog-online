import { describe, expect, it } from 'vitest';

import { firstIncompleteStep } from '../setup-steps';

describe('шаг мастера', () => {
  it('ведёт на первое незаполненное поле', () => {
    expect(firstIncompleteStep({ name: null, subdomain: null, whatsapp: null })).toBe(1);
    expect(firstIncompleteStep({ name: 'Лавка', subdomain: null, whatsapp: null })).toBe(2);
    expect(firstIncompleteStep({ name: 'Лавка', subdomain: 'lavka', whatsapp: null })).toBe(3);
    expect(firstIncompleteStep({ name: 'Лавка', subdomain: 'lavka', whatsapp: '+77000000000' })).toBe(4);
  });
});
