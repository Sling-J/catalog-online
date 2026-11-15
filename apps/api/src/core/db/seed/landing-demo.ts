import type { DemoRows } from './demo-shop.js';

/**
 * Демо для лендинга (`demo:publish`, `04-design/storefront.md`, S12): у товаров, которые в моках без фото, — свои
 * фото с Unsplash (`design-assets/storefront/CREDITS.md`). Ключ — название товара демо.
 */
export const LANDING_PHOTOS: Readonly<Record<string, string>> = {
  'Комбинезон зимний': 'snowsuit-blue',
  'Варежки детские': 'mittens',
  'Жилет утеплённый': 'vest-blue',
  Ветровка: 'windbreaker-orange',
  'Платье нарядное': 'dress-party',
  'Лонгслив полосатый': 'longsleeve-striped',
  Водолазка: 'turtleneck-black',
  'Свитшот с принтом': 'sweatshirt-yellow',
  'Футболка базовая': 'tshirt-blue',
  'Рубашка в клетку': 'shirt-plaid',
  'Сандалии кожаные': 'sandals',
  'Сапоги резиновые': 'rainboots',
  'Тапочки домашние': 'slippers',
  Панама: 'panama',
  'Носки, 3 пары': 'socks',
  Кепка: 'cap-blue',
  Перчатки: 'gloves',
};

/** Подходящего бесплатного фото не нашлось — в демо для лендинга эти товары скрыты (на витрине без пустых плиток). */
export const LANDING_HIDDEN: readonly string[] = ['Сарафан джинсовый', 'Юбка плиссе', 'Шарф вязаный'];

/** Id фото — от id товара, чтобы повторный запуск давал те же строки: `…-8000-…` → `…-8001-…`. */
const photoIdOf = (productId: string) => productId.replace(/-8000-/, '-8001-');

/** Строки демо-данных → демо для лендинга: фото товарам без фото, скрыть товары без подходящего фото. */
export function forLanding(rows: DemoRows): DemoRows {
  const withPhoto = new Set(rows.productPhotos.map((photo) => photo.productId));
  const extra: DemoRows['productPhotos'] = rows.products.flatMap((product) => {
    const file = LANDING_PHOTOS[product.name];
    if (!file || withPhoto.has(product.id!)) return [];
    const key = `demo/${file}.jpg`;
    return [
      {
        id: photoIdOf(product.id!),
        shopId: product.shopId,
        productId: product.id!,
        position: 0,
        originalKey: key,
        sizes: { '320': key, '640': key, '1280': key },
        width: 800,
        height: 1000,
        status: 'ready' as const,
      },
    ];
  });
  return {
    ...rows,
    products: rows.products.map((product) =>
      LANDING_HIDDEN.includes(product.name) ? { ...product, isVisible: false } : product,
    ),
    productPhotos: [...rows.productPhotos, ...extra],
  };
}
