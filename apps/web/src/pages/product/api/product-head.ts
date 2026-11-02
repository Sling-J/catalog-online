import { formatPrice } from '@catalog/ui';
import type { StorefrontProduct, StorefrontShop } from '@catalog/contract';
import type { I18n } from '@lingui/core';
import { msg } from '@lingui/core/macro';

import { getPriceRange, isInStock, productPath } from '@/entities/product';
import { buildPageHead, clipDescription, type PageHead } from '@/shared/lib';

/**
 * Заголовок и превью ссылки товара (NFR-5, US-B10): «Куртка — 18 900 ₸ · Айгерим Kids», первое фото,
 * цена в Open Graph и разметка schema.org Product с ценой и наличием — для превью в мессенджерах и поиска.
 */
export function productHead({
  i18n,
  origin,
  shop,
  product,
}: {
  i18n: I18n;
  origin: string;
  shop: StorefrontShop;
  product: StorefrontProduct;
}): PageHead {
  const { min, max } = getPriceRange(product);
  const price = min === max ? formatPrice(min) : i18n._(msg`от ${formatPrice(min)}`);
  const inStock = product.variants.some(isInStock);
  const url = `${origin}/${productPath(product)}`;
  const shopName = shop.name;
  const productName = product.name;
  const description = clipDescription(
    product.description ??
      (inStock
        ? i18n._(msg`${productName} в магазине «${shopName}», ${price}. Заказ — в WhatsApp.`)
        : i18n._(msg`${productName} в магазине «${shopName}». Сейчас закончился — спросите в WhatsApp.`)),
  );
  const photos = product.photos.map((photo) => new URL(photo.sizes['1280'], origin).href);
  const availability = inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock';

  return buildPageHead({
    title: i18n._(msg`${productName} — ${price} · ${shopName}`),
    description,
    url,
    siteName: shopName,
    type: 'product',
    image: photos[0] ? { url: photos[0], alt: productName } : undefined,
    properties: {
      'product:price:amount': String(min),
      'product:price:currency': 'KZT',
      'product:availability': inStock ? 'in stock' : 'out of stock',
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: productName,
      sku: product.shortId,
      ...(product.description ? { description: product.description } : {}),
      ...(photos.length > 0 ? { image: photos } : {}),
      ...(product.category ? { category: product.category.name } : {}),
      offers:
        min === max
          ? { '@type': 'Offer', price: min, priceCurrency: 'KZT', availability, url }
          : { '@type': 'AggregateOffer', lowPrice: min, highPrice: max, priceCurrency: 'KZT', availability, url },
    },
  });
}
