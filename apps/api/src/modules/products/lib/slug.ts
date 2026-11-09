import { randomInt } from 'node:crypto';

/** Русские и казахские буквы латиницей (как в загранпаспорте, казахские — без диакритики). */
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'yo', ж: 'zh', з: 'z', и: 'i', й: 'y', к: 'k', л: 'l',
  м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'shch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  '№': 'no',
  ә: 'a', ғ: 'g', қ: 'q', ң: 'n', ө: 'o', ұ: 'u', ү: 'u', һ: 'h', і: 'i',
}; // prettier-ignore

const MAX_SLUG = 60;

/**
 * Читаемая часть адреса товара: «Куртка демисезонная» → `kurtka-demisezonnaya` (DM3: `/<slug>-<shortId>`).
 * Товар ищется по `shortId`, поэтому slug может меняться и повторяться. Ничего не осталось — `tovar`.
 */
export function slugify(name: string): string {
  // сначала свои буквы (NFKD разложил бы «й» и «ё» на букву и знак), потом знаки с диакритикой: café → cafe
  const latin = [...name.toLowerCase()].map((char) => TRANSLIT[char] ?? char).join('');
  const slug = latin
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) return 'tovar';
  if (slug.length <= MAX_SLUG) return slug;
  const cut = slug.slice(0, MAX_SLUG);
  const lastDash = cut.lastIndexOf('-');
  return lastDash > MAX_SLUG / 2 ? cut.slice(0, lastDash) : cut;
}

const SHORT_ID_ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyz';
export const SHORT_ID_LENGTH = 5;

/** Код товара в адресе витрины: 5 символов base36 (DM3). Уникальность в магазине проверяет сервис. */
export function newShortId(): string {
  return Array.from({ length: SHORT_ID_LENGTH }, () => SHORT_ID_ALPHABET[randomInt(SHORT_ID_ALPHABET.length)]).join('');
}

/**
 * Артикулы для вариантов без артикула: `<КОД>-1`, `<КОД>-2`… (решение основателя 2026-11-09, T-407). Пропускает
 * занятые (`taken` — уже есть в магазине или введены в этой же таблице).
 */
export function generateSkus(shortId: string, count: number, taken: Set<string>): string[] {
  const prefix = shortId.toUpperCase();
  const result: string[] = [];
  for (let n = 1; result.length < count; n++) {
    const sku = `${prefix}-${n}`;
    if (!taken.has(sku)) result.push(sku);
  }
  return result;
}
