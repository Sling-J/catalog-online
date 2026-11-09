// Строки базы для демо-магазина «Айгерим Kids» — из тех же данных, что моки фронтов (`@catalog/contract/fixtures`),
// чтобы витрина и админка на настоящем API выглядели как на моках. Чистая функция, без базы.
import {
  createDemoAdminAttributes,
  createDemoAdminProducts,
  DEMO_ACCOUNT_ID,
  DEMO_ADMIN_EMAIL,
  DEMO_SHOP_ID,
  demoCategoryRecords,
  demoShop,
  demoShopSettings,
  demoStats,
  HIDDEN_DEMO_SUBDOMAIN,
} from '@catalog/contract/fixtures';
import type { InferInsertModel } from 'drizzle-orm';

import type {
  accounts,
  attributes,
  attributeValues,
  categories,
  dailyStats,
  productPhotos,
  products,
  shops,
  variants,
  variantValues,
} from '../schema/index.js';

export type DemoRows = {
  shops: InferInsertModel<typeof shops>[];
  accounts: InferInsertModel<typeof accounts>[];
  categories: InferInsertModel<typeof categories>[];
  attributes: InferInsertModel<typeof attributes>[];
  attributeValues: InferInsertModel<typeof attributeValues>[];
  products: InferInsertModel<typeof products>[];
  variants: InferInsertModel<typeof variants>[];
  variantValues: InferInsertModel<typeof variantValues>[];
  productPhotos: InferInsertModel<typeof productPhotos>[];
  dailyStats: InferInsertModel<typeof dailyStats>[];
};

/** Магазин со скрытым каталогом: витрина отвечает 410 «Каталог сейчас обновляется», открывается только в превью. */
export const HIDDEN_SHOP_ID = '0192d000-0000-7000-8000-00000000a003';
export const HIDDEN_ACCOUNT_ID = '0192d000-0000-7000-8000-00000000b003';
export const HIDDEN_ADMIN_EMAIL = 'skrytyj@example.com';

/** Фото демо-магазина лежат в хранилище по ключу `demo/<имя>.jpg` (из адреса картинки моков без базового адреса). */
const keyOf = (url: string): string => url.replace(/^\//, '');

/**
 * Все строки демо-данных. `passwordHash` — хеш `DEMO_ADMIN_PASSWORD` (argon2), считается снаружи, чтобы функция
 * оставалась чистой. `now` — от него считаются дни статистики.
 */
export function buildDemoRows(passwordHash: string, now = Date.now()): DemoRows {
  const adminProducts = createDemoAdminProducts('');
  const adminAttributes = createDemoAdminAttributes(adminProducts);
  const publishedAt = new Date(demoShopSettings.publishedAt);
  const { subdomain, name, description, whatsapp, instagram, address, howToFind, schedule, timezone, stockDisplay } =
    demoShop;

  const shopRows: DemoRows['shops'] = [
    {
      id: DEMO_SHOP_ID,
      subdomain,
      name,
      description,
      whatsapp,
      instagram,
      address,
      howToFind,
      schedule,
      timezone,
      stockDisplay,
      status: 'published',
      lowStockThreshold: demoShopSettings.lowStockThreshold,
      showOutOfStock: demoShopSettings.showOutOfStock,
      setupCompleted: true,
      publishedAt,
    },
    {
      id: HIDDEN_SHOP_ID,
      subdomain: HIDDEN_DEMO_SUBDOMAIN,
      name: 'Скрытый магазин',
      whatsapp,
      address,
      schedule,
      timezone,
      status: 'draft',
      setupCompleted: true,
    },
  ];

  const accountRows: DemoRows['accounts'] = [
    { id: DEMO_ACCOUNT_ID, shopId: DEMO_SHOP_ID, email: DEMO_ADMIN_EMAIL, passwordHash, emailVerifiedAt: publishedAt },
    {
      id: HIDDEN_ACCOUNT_ID,
      shopId: HIDDEN_SHOP_ID,
      email: HIDDEN_ADMIN_EMAIL,
      passwordHash,
      emailVerifiedAt: publishedAt,
    },
  ];

  const categoryRows: DemoRows['categories'] = demoCategoryRecords().map((record) => ({
    id: record.id,
    shopId: DEMO_SHOP_ID,
    parentId: record.parentId,
    name: record.name,
    path: record.name,
    position: record.position,
  }));

  const attributeRows: DemoRows['attributes'] = adminAttributes.map((attribute) => ({
    id: attribute.id,
    shopId: DEMO_SHOP_ID,
    name: attribute.name,
    position: attribute.position,
    inFilters: attribute.inFilters,
  }));
  const attributeValueRows: DemoRows['attributeValues'] = adminAttributes.flatMap((attribute) =>
    attribute.values.map((value) => ({
      id: value.id,
      shopId: DEMO_SHOP_ID,
      attributeId: attribute.id,
      value: value.value,
      position: value.position,
    })),
  );

  const productRows: DemoRows['products'] = adminProducts.map((product) => {
    const prices = product.variants.map((variant) => variant.price);
    return {
      id: product.id,
      shopId: DEMO_SHOP_ID,
      categoryId: product.categoryId,
      name: product.name,
      description: product.description ?? null,
      isVisible: product.isVisible,
      slug: product.slug,
      shortId: product.shortId,
      importedFields: product.importedFields,
      minPrice: Math.min(...prices),
      maxPrice: Math.max(...prices),
      totalStock: product.variants.reduce((sum, variant) => sum + variant.stock, 0),
      createdAt: new Date(product.createdAt),
      updatedAt: new Date(product.updatedAt),
    };
  });

  const variantRows: DemoRows['variants'] = adminProducts.flatMap((product) =>
    product.variants.map((variant, position) => ({
      id: variant.id,
      shopId: DEMO_SHOP_ID,
      productId: product.id,
      sku: variant.sku,
      barcode: variant.barcode ?? null,
      price: variant.price,
      stock: variant.stock,
      position,
    })),
  );
  const variantValueRows: DemoRows['variantValues'] = adminProducts.flatMap((product) =>
    product.variants.flatMap((variant) =>
      variant.values.map((value) => ({ variantId: variant.id, attributeValueId: value.valueId })),
    ),
  );

  const photoRows: DemoRows['productPhotos'] = adminProducts.flatMap((product) =>
    product.photos.flatMap((photo) => {
      if (!photo.image) return [];
      const { sizes, width, height } = photo.image;
      return [
        {
          id: photo.id,
          shopId: DEMO_SHOP_ID,
          productId: product.id,
          position: photo.position,
          originalKey: keyOf(sizes['1280']),
          sizes: { '320': keyOf(sizes['320']), '640': keyOf(sizes['640']), '1280': keyOf(sizes['1280']) },
          width,
          height,
          status: 'ready' as const,
        },
      ];
    }),
  );

  return {
    shops: shopRows,
    accounts: accountRows,
    categories: categoryRows,
    attributes: attributeRows,
    attributeValues: attributeValueRows,
    products: productRows,
    variants: variantRows,
    variantValues: variantValueRows,
    productPhotos: photoRows,
    dailyStats: buildDemoStats(adminProducts, now),
  };
}

/**
 * Статистика как на моках: по витрине — 150 дней (последняя неделя — числа из макета), по товарам — «чаще смотрят»
 * за неделю, просмотры поровну по дням.
 */
function buildDemoStats(
  adminProducts: ReturnType<typeof createDemoAdminProducts>,
  now: number,
): DemoRows['dailyStats'] {
  const all = demoStats('all', adminProducts, now).byDay;
  const week = demoStats('7d', adminProducts, now);
  const weekByDate = new Map(week.byDay.map((day) => [day.date, day]));
  const shopDays = all.map((day) => weekByDate.get(day.date) ?? day);
  const rows: DemoRows['dailyStats'] = shopDays.map((day) => ({
    shopId: DEMO_SHOP_ID,
    date: day.date,
    productId: null,
    views: day.views,
    orderClicks: day.orderClicks,
  }));
  for (const top of week.topProducts) {
    const perDay = Math.floor(top.views / week.byDay.length);
    week.byDay.forEach((day, index) => {
      const rest = index === week.byDay.length - 1 ? top.views - perDay * week.byDay.length : 0;
      rows.push({
        shopId: DEMO_SHOP_ID,
        date: day.date,
        productId: top.productId,
        views: perDay + rest,
        orderClicks: 0,
      });
    });
  }
  return rows;
}
