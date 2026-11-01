/** Что маршрут отдаёт в `head()`: теги `<meta>`, `<link>` и скрипты разметки (JSON-LD). */
export type PageHead = {
  meta: Array<Record<string, string>>;
  links: Array<{ rel: string; href: string }>;
  scripts: Array<{ type: string; children: string }>;
};

export type PageHeadInput = {
  title: string;
  description: string;
  /** Канонический адрес страницы — он же og:url. */
  url: string;
  siteName: string;
  type: 'website' | 'product';
  image?: { url: string; alt: string };
  /** `noindex, follow` — для выборок с поиском и фильтрами. */
  robots?: string;
  /** Дополнительные Open Graph, например `product:price:amount`. */
  properties?: Record<string, string>;
  /** Разметка schema.org (Product). */
  jsonLd?: object;
};

const DESCRIPTION_LIMIT = 160;

/** Описание для поисковика и превью: одна строка, не длиннее 160 знаков, обрезано по слову. */
export function clipDescription(text: string, limit = DESCRIPTION_LIMIT): string {
  const line = text.replace(/\s+/g, ' ').trim();
  if (line.length <= limit) return line;
  const cut = line.slice(0, limit - 1);
  const space = cut.lastIndexOf(' ');
  return `${(space > limit / 2 ? cut.slice(0, space) : cut).replace(/[\s,.;:—-]+$/, '')}…`;
}

// JSON внутри <script> не должен закрыть тег: «<» в строках экранируем
const safeJson = (value: object): string => JSON.stringify(value).replace(/</g, '\\u003c');

/**
 * Заголовок, описание, каноническая ссылка и превью ссылки (Open Graph, NFR-5): так страница выглядит
 * в поиске и в WhatsApp, Telegram, Instagram.
 */
export function buildPageHead(input: PageHeadInput): PageHead {
  const meta: PageHead['meta'] = [
    { title: input.title },
    { name: 'description', content: input.description },
    { property: 'og:type', content: input.type },
    { property: 'og:site_name', content: input.siteName },
    { property: 'og:locale', content: 'ru_RU' },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: input.description },
    { property: 'og:url', content: input.url },
    { name: 'twitter:card', content: input.image ? 'summary_large_image' : 'summary' },
  ];
  // мессенджеры понимают только полный адрес картинки
  if (input.image) {
    meta.push(
      { property: 'og:image', content: new URL(input.image.url, input.url).href },
      { property: 'og:image:alt', content: input.image.alt },
    );
  }
  for (const [property, content] of Object.entries(input.properties ?? {})) meta.push({ property, content });
  if (input.robots) meta.push({ name: 'robots', content: input.robots });
  return {
    meta,
    links: [{ rel: 'canonical', href: input.url }],
    scripts: input.jsonLd ? [{ type: 'application/ld+json', children: safeJson(input.jsonLd) }] : [],
  };
}

/** Страница, которой нет в поиске: «не найдено», скрытый магазин, ошибка. */
export const NOINDEX_HEAD = { meta: [{ name: 'robots', content: 'noindex' }] };
