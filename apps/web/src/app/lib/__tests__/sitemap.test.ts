import { describe, expect, it } from 'vitest';

import { renderSitemap } from '../sitemap';

describe('sitemap витрины', () => {
  it('экранирует адреса в XML', () => {
    const xml = renderSitemap(['https://a.katalog.kz/', 'https://a.katalog.kz/?category=1&x=2']);
    expect(xml).toContain('<loc>https://a.katalog.kz/</loc>');
    expect(xml).toContain('<loc>https://a.katalog.kz/?category=1&amp;x=2</loc>');
    expect(xml.startsWith('<?xml')).toBe(true);
  });
});
