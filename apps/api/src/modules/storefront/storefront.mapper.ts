import type {
  Image,
  StorefrontProduct,
  StorefrontProductCard,
  StorefrontShop,
  StorefrontShopGone,
} from '@catalog/contract';

import type { StoredImage } from '../../core/images/index.js';
import { stockLevel, toStockInfo, type StockSettings } from './lib/stock.js';
import type {
  CardRow,
  ProductDetailRow,
  StorefrontShopRow,
  VariantRow,
  VariantValueRow,
} from './storefront.repository.js';

/** Адреса картинок (`Images.toImage`) — снаружи: маппер не знает о хранилище. */
export type ToImage = (image: StoredImage) => Image;

/** Открытый магазин: название, адрес витрины и WhatsApp у него точно есть (публикация их требует, A9). */
export function toStorefrontShop(row: StorefrontShopRow, isPreview: boolean, toImage: ToImage): StorefrontShop {
  return {
    subdomain: row.subdomain ?? '',
    name: row.name ?? '',
    logo: row.logo ? toImage(row.logo) : null,
    description: row.description,
    address: row.address,
    howToFind: row.howToFind,
    whatsapp: row.whatsapp ?? '',
    instagram: row.instagram,
    schedule: row.schedule,
    timezone: row.timezone,
    stockDisplay: row.stockDisplay,
    isPreview,
  };
}

/** Контакты для заглушки «Каталог скрыт» (тело 410). */
export function toGoneShop(row: StorefrontShopRow, toImage: ToImage): StorefrontShopGone['shop'] {
  return {
    name: row.name ?? '',
    logo: row.logo ? toImage(row.logo) : null,
    address: row.address,
    whatsapp: row.whatsapp ?? '',
    schedule: row.schedule,
    timezone: row.timezone,
  };
}

export function toCard(
  row: CardRow,
  cover: StoredImage | undefined,
  threshold: number,
  toImage: ToImage,
): StorefrontProductCard {
  return {
    id: row.id,
    shortId: row.shortId,
    slug: row.slug,
    name: row.name,
    price: row.price,
    priceVaries: row.price !== row.maxPrice,
    cover: cover ? toImage(cover) : null,
    stockLevel: stockLevel(row.totalStock, threshold),
  };
}

/**
 * Карточка товара (FR-V6): свойства — только те, что есть у вариантов, в порядке витрины (свойство, затем
 * значение); у варианта — id его значений.
 */
export function toStorefrontProduct(
  row: ProductDetailRow,
  variants: VariantRow[],
  values: VariantValueRow[],
  photos: StoredImage[],
  settings: StockSettings,
  toImage: ToImage,
): StorefrontProduct {
  const attributes: StorefrontProduct['attributes'] = [];
  for (const value of values) {
    let attribute = attributes.find((entry) => entry.id === value.attributeId);
    if (!attribute) {
      attribute = { id: value.attributeId, name: value.attributeName, values: [] };
      attributes.push(attribute);
    }
    if (!attribute.values.some((entry) => entry.id === value.valueId)) {
      attribute.values.push({ id: value.valueId, value: value.value });
    }
  }
  return {
    id: row.id,
    shortId: row.shortId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    category: row.categoryId && row.categoryName ? { id: row.categoryId, name: row.categoryName } : null,
    photos: photos.map(toImage),
    attributes,
    variants: variants.map((variant) => ({
      id: variant.id,
      valueIds: values.filter((value) => value.variantId === variant.id).map((value) => value.valueId),
      price: variant.price,
      stock: toStockInfo(variant.stock, settings),
    })),
  };
}
