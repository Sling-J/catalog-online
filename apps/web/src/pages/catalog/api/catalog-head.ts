import type { StorefrontCategory, StorefrontProductCard, StorefrontShop } from '@catalog/contract';
import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { findCategoryPath } from '@/entities/category';
import type { CatalogSearch } from '@/entities/product';
import { buildPageHead, clipDescription, type PageHead } from '@/shared/lib';

/**
 * Заголовок и превью ссылки каталога (NFR-5): «Платья — Айгерим Kids», описание магазина, логотип или фото
 * первого товара. Каноническая ссылка — витрина или категория; поиск, фильтры и сортировка в неё не входят,
 * а выборки с поиском и фильтрами не индексируются.
 */
export function catalogHead({
  i18n,
  origin,
  shop,
  categories,
  search,
  firstCard,
}: {
  i18n: I18n;
  origin: string;
  shop: StorefrontShop;
  categories: StorefrontCategory[];
  search: CatalogSearch;
  firstCard: StorefrontProductCard | undefined;
}): PageHead {
  const category = search.category ? findCategoryPath(categories, search.category).at(-1) : undefined;
  const name = shop.name;
  const title = category ? i18n._(msg`${category.name} — ${name}`) : i18n._(msg`${name} — каталог с ценами и наличием`);
  const description = clipDescription(
    shop.description ?? i18n._(msg`Каталог магазина «${name}»: цены, размеры и наличие. Заказ — в WhatsApp.`),
  );
  const cover = shop.logo ?? firstCard?.cover;
  const filtered = !!(search.q || search.values || search.priceMin !== undefined || search.priceMax !== undefined);

  return buildPageHead({
    title,
    description,
    url: category ? `${origin}/?category=${encodeURIComponent(category.id)}` : `${origin}/`,
    siteName: name,
    type: 'website',
    image: cover ? { url: cover.sizes['1280'], alt: shop.logo ? name : (firstCard?.name ?? name) } : undefined,
    robots: filtered ? 'noindex, follow' : undefined,
  });
}
