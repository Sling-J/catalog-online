import type { Image, Photo, Product, ProductListItem, Variant } from '@catalog/contract';

import type { StoredImage } from '../../core/images/index.js';
import type { ProductPhotoRow } from './product-photos.repository.js';
import type { ProductListRow, ProductRow } from './products.repository.js';
import type { VariantRow, VariantValueRow } from './variants.repository.js';

/** Адреса картинок (`Images.toImage`) — снаружи: маппер не знает о хранилище. */
export type ToImage = (image: StoredImage) => Image;

export function toPhoto(row: ProductPhotoRow, toImage: ToImage): Photo {
  const ready = row.status === 'ready' && row.sizes && row.width && row.height;
  return {
    id: row.id,
    position: row.position,
    status: row.status,
    image: ready ? toImage({ width: row.width!, height: row.height!, sizes: row.sizes! }) : null,
  };
}

export function toVariant(row: VariantRow, values: VariantValueRow[]): Variant {
  return {
    id: row.id,
    sku: row.sku,
    barcode: row.barcode,
    price: row.price,
    stock: row.stock,
    values: values.map(({ attributeId, attributeName, valueId, value }) => ({
      attributeId,
      attributeName,
      valueId,
      value,
    })),
  };
}

export function toProduct(
  row: ProductRow,
  variants: VariantRow[],
  values: VariantValueRow[],
  photos: ProductPhotoRow[],
  toImage: ToImage,
): Product {
  return {
    id: row.id,
    shortId: row.shortId,
    slug: row.slug,
    name: row.name,
    description: row.description,
    categoryId: row.categoryId,
    isVisible: row.isVisible,
    importedFields: row.importedFields,
    photos: photos.map((photo) => toPhoto(photo, toImage)),
    variants: variants.map((variant) =>
      toVariant(
        variant,
        values.filter((value) => value.variantId === variant.id),
      ),
    ),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Строка списка: артикул и число вариантов, обложка — первое фото (пока сжимается — `null`). */
export function toListItem(
  row: ProductListRow,
  variants: VariantRow[],
  photos: ProductPhotoRow[],
  toImage: ToImage,
): ProductListItem {
  const cover = photos[0];
  return {
    id: row.id,
    name: row.name,
    sku: variants[0]?.sku ?? '',
    category: row.categoryId && row.categoryName ? { id: row.categoryId, name: row.categoryName } : null,
    price: row.minPrice,
    priceVaries: row.minPrice !== row.maxPrice,
    totalStock: row.totalStock,
    variantCount: variants.length,
    isVisible: row.isVisible,
    cover: cover ? toPhoto(cover, toImage).image : null,
    photoCount: photos.length,
  };
}
