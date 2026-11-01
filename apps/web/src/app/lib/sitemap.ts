import {
  listStorefrontCategories,
  listStorefrontProducts,
  type StorefrontCategory,
  type StorefrontProductCard,
} from '@catalog/contract';

import { productPath } from '@/entities/product';

// предел на случай огромного магазина: sitemap до 50 000 адресов, нам хватит и меньше
const PAGE_LIMIT = 100;
const MAX_PAGES = 200;

const escapeXml = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const flatten = (categories: StorefrontCategory[]): StorefrontCategory[] =>
  categories.flatMap((category) => [category, ...flatten(category.children)]);

/** Все товары витрины по курсору (API3). */
async function listAllProducts(subdomain: string): Promise<StorefrontProductCard[]> {
  const cards: StorefrontProductCard[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MAX_PAGES; page++) {
    const { data } = await listStorefrontProducts({
      path: { subdomain },
      query: { limit: PAGE_LIMIT, cursor },
      throwOnError: true,
    });
    cards.push(...data.items);
    if (!data.nextCursor) break;
    cursor = data.nextCursor;
  }
  return cards;
}

/** Адреса sitemap витрины: главная, категории и карточки товаров (NFR-5). */
export async function shopSitemapUrls(subdomain: string, origin: string): Promise<string[]> {
  const [{ data: categories }, products] = await Promise.all([
    listStorefrontCategories({ path: { subdomain }, throwOnError: true }),
    listAllProducts(subdomain),
  ]);
  return [
    `${origin}/`,
    ...flatten(categories).map((category) => `${origin}/?category=${encodeURIComponent(category.id)}`),
    ...products.map((card) => `${origin}/${productPath(card)}`),
  ];
}

export function renderSitemap(urls: string[]): string {
  const items = urls.map((url) => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}
