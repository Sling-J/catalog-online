import { describe, expect, it } from 'vitest';

import { buildPageHead, clipDescription } from '../page-head';

describe('теги страницы для поиска и превью ссылок', () => {
  it('обрезает длинное описание по слову и в одну строку', () => {
    const text = `Куртка\nдемисезонная ${'очень тёплая '.repeat(20)}`;
    const clipped = clipDescription(text, 40);
    expect(clipped.length).toBeLessThanOrEqual(40);
    expect(clipped).toMatch(/^Куртка демисезонная очень тёплая.*…$/);
    expect(clipDescription('Коротко')).toBe('Коротко');
  });

  it('собирает Open Graph, каноническую ссылку и JSON-LD без закрытия тега', () => {
    const head = buildPageHead({
      title: 'Куртка — 18 900 ₸ · Айгерим Kids',
      description: 'Описание',
      url: 'https://aigerim-kids.katalog.kz/kurtka-a1b2c',
      siteName: 'Айгерим Kids',
      type: 'product',
      image: { url: 'https://cdn/1280.webp', alt: 'Куртка' },
      properties: { 'product:price:amount': '18900' },
      jsonLd: { name: '</script><script>alert(1)' },
    });
    expect(head.meta).toContainEqual({ property: 'og:image', content: 'https://cdn/1280.webp' });
    expect(head.meta).toContainEqual({ property: 'product:price:amount', content: '18900' });
    expect(head.meta).toContainEqual({ name: 'twitter:card', content: 'summary_large_image' });
    expect(head.links).toEqual([{ rel: 'canonical', href: 'https://aigerim-kids.katalog.kz/kurtka-a1b2c' }]);
    expect(head.scripts[0]!.children).not.toContain('</script>');
  });
});
