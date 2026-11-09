// Каталог (data-model.md, «Каталог»): категории, свойства, товары, варианты, фото.
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  uniqueIndex,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';

import { createdAt, id, updatedAt } from './columns.js';
import { shops } from './shops.js';

const shopRef = () =>
  uuid()
    .notNull()
    .references(() => shops.id, { onDelete: 'cascade' });

/** Корневые категории в уникальном индексе: NULL родителя заменяем нулевым UUID, чтобы имена корней не повторялись. */
const NO_PARENT = sql`'00000000-0000-0000-0000-000000000000'::uuid`;

/**
 * Категории, до 2 уровней (проверка в коде). Имя уникально среди соседей без учёта регистра.
 * Категорию с подкатегориями удалить нельзя (A28) — внешний ключ на родителя без каскада (`no action`: проверка в
 * конце запроса, поэтому удаление магазина каскадом проходит, а прямое удаление родителя — нет).
 */
export const categories = pgTable(
  'categories',
  {
    id: id(),
    shopId: shopRef(),
    parentId: uuid().references((): AnyPgColumn => categories.id, { onDelete: 'no action' }),
    name: text().notNull(),
    /** `Девочки / Куртки` — для сопоставления при импорте. */
    path: text().notNull(),
    position: integer().notNull().default(0),
  },
  (t) => [
    uniqueIndex('categories_name_unique').on(
      t.shopId,
      sql`coalesce(${t.parentId}, ${NO_PARENT})`,
      sql`lower(${t.name})`,
    ),
    index('categories_parent_idx').on(t.parentId),
  ],
);

/** Свойства вариантов: Рост, Размер обуви, Цвет (D4). */
export const attributes = pgTable(
  'attributes',
  {
    id: id(),
    shopId: shopRef(),
    name: text().notNull(),
    position: integer().notNull().default(0),
    inFilters: boolean().notNull().default(true),
  },
  (t) => [uniqueIndex('attributes_name_unique').on(t.shopId, sql`lower(${t.name})`)],
);

/**
 * Значения свойства: 92, 98, 104… `shopId` продублирован, чтобы каждый запрос фильтровался по магазину без
 * соединения таблиц (backend-structure.md, раздел 6).
 */
export const attributeValues = pgTable(
  'attribute_values',
  {
    id: id(),
    shopId: shopRef(),
    attributeId: uuid()
      .notNull()
      .references(() => attributes.id, { onDelete: 'cascade' }),
    value: text().notNull(),
    position: integer().notNull().default(0),
  },
  (t) => [uniqueIndex('attribute_values_value_unique').on(t.attributeId, sql`lower(${t.value})`)],
);

/** Поля товара, которые перезапишет следующий импорт (контракт `Product.importedFields`). */
export type ImportedField = 'name' | 'category' | 'variants';

/** Карточка товара (FR-A5). `minPrice`, `maxPrice`, `totalStock` пересчитываются при изменении вариантов. */
export const products = pgTable(
  'products',
  {
    id: id(),
    shopId: shopRef(),
    categoryId: uuid().references(() => categories.id, { onDelete: 'set null' }),
    name: text().notNull(),
    description: text(),
    /** Скрытый и «черновик» — `false`. */
    isVisible: boolean().notNull().default(true),
    /** «Код товара» из импорта; пусто — нормализованное название (FR-A3). */
    groupKey: text(),
    slug: text().notNull(),
    /** 5–6 символов base36, по нему товар ищется по адресу витрины (DM3). */
    shortId: text().notNull(),
    importedFields: text()
      .array()
      .$type<ImportedField[]>()
      .notNull()
      .default(sql`'{}'::text[]`),
    minPrice: integer().notNull().default(0),
    maxPrice: integer().notNull().default(0),
    totalStock: integer().notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('products_short_id_unique').on(t.shopId, t.shortId),
    index('products_shop_created_idx').on(t.shopId, t.createdAt),
    index('products_shop_group_key_idx').on(t.shopId, t.groupKey),
    index('products_category_idx').on(t.categoryId),
  ],
);

/** Конкретная позиция (размер) — ключ импорта: артикул уникален в магазине (FR-A3). */
export const variants = pgTable(
  'variants',
  {
    id: id(),
    shopId: shopRef(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    sku: text().notNull(),
    barcode: text(),
    price: integer().notNull(),
    stock: integer().notNull().default(0),
    position: integer().notNull().default(0),
  },
  (t) => [
    uniqueIndex('variants_sku_unique').on(t.shopId, t.sku),
    index('variants_product_idx').on(t.productId),
    check('variants_price_non_negative', sql`${t.price} >= 0`),
    check('variants_stock_non_negative', sql`${t.stock} >= 0`),
  ],
);

/**
 * Значения свойств варианта. Удаление свойства или значения снимает его с вариантов (каскад) — так в контракте
 * `deleteAttribute`. Запрет «значение стоит у вариантов» (409 `attribute_value_in_use` в `PUT …/values`) проверяет
 * сервис: внешний ключ без каскада ломал удаление магазина (pitfalls.md). Не больше одного значения каждого свойства — проверка в коде.
 */
export const variantValues = pgTable(
  'variant_values',
  {
    variantId: uuid()
      .notNull()
      .references(() => variants.id, { onDelete: 'cascade' }),
    attributeValueId: uuid()
      .notNull()
      .references(() => attributeValues.id, { onDelete: 'cascade' }),
  },
  (t) => [
    primaryKey({ columns: [t.variantId, t.attributeValueId] }),
    index('variant_values_value_idx').on(t.attributeValueId),
  ],
);

export const photoStatus = pgEnum('photo_status', ['processing', 'ready', 'failed']);

/** Ключи готовых размеров в хранилище (WebP): `{ "320": key, "640": key, "1280": key }`. */
export type PhotoSizes = Record<'320' | '640' | '1280', string>;

/** Фото товара (FR-A4). `position` 0 — обложка; размеры и стороны известны после обработки. */
export const productPhotos = pgTable(
  'product_photos',
  {
    id: id(),
    shopId: shopRef(),
    productId: uuid()
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    position: integer().notNull().default(0),
    originalKey: text().notNull(),
    sizes: jsonb().$type<PhotoSizes>(),
    width: integer(),
    height: integer(),
    status: photoStatus().notNull().default('processing'),
    createdAt: createdAt(),
  },
  (t) => [index('product_photos_product_idx').on(t.productId, t.position)],
);
