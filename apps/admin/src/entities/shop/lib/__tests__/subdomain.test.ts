import { describe, expect, it } from 'vitest';

import { SUBDOMAIN_PATTERN, subdomainFromName } from '../subdomain';

describe('адрес витрины по названию', () => {
  it('переводит кириллицу и казахские буквы в латиницу', () => {
    expect(subdomainFromName('Айгерим Kids')).toBe('aigerim-kids');
    expect(subdomainFromName('Ақ Күміс')).toBe('ak-kumis');
    expect(subdomainFromName('Щедрый «Дом» №1')).toBe('shchedryi-dom-1');
  });

  it('обрезает до 30 символов без дефиса на конце и годится для проверки', () => {
    const value = subdomainFromName('Очень длинное название магазина детской одежды');
    expect(value.length).toBeLessThanOrEqual(30);
    expect(SUBDOMAIN_PATTERN.test(value)).toBe(true);
  });
});
