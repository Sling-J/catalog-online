const PRODUCT_PATH = /^(.+)-([0-9a-z]{5,6})$/;

/** Адрес товара: `<slug>-<shortId>`. Нужен именно shortId — по нему ищем, slug может устареть (тогда 301). */
export const productPath = (product: { slug: string; shortId: string }): string => `${product.slug}-${product.shortId}`;

/** Разбор адреса товара; чужие адреса (`robots.txt`, опечатки) дают `null`, и запрос к API не нужен. */
export function parseProductPath(path: string): { slug: string; shortId: string } | null {
  const match = PRODUCT_PATH.exec(path);
  return match ? { slug: match[1]!, shortId: match[2]! } : null;
}
