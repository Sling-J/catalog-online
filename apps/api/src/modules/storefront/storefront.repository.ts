import { and, asc, eq, gt, ilike, inArray, sql, type SQL } from 'drizzle-orm';
import type { InferSelectModel } from 'drizzle-orm';

import type { DbOrTx } from '../../core/db/index.js';
import {
  attributes,
  attributeValues,
  categories,
  productPhotos,
  products,
  shops,
  variants,
  variantValues,
} from '../../core/db/schema/index.js';
import type { StoredImage } from '../../core/images/index.js';
import type { CursorValue } from '../../core/pagination/index.js';
import type { CategoryCountRow } from './lib/categories.js';
import type { FacetAttribute, FacetVariant } from './lib/facets.js';

export type StorefrontShopRow = InferSelectModel<typeof shops>;
export type StorefrontSort = 'new' | 'price_asc' | 'price_desc';

/** Выборка без фильтров по вариантам: категория (с подкатегориями) и поиск по названию (FR-V2, FR-V3). */
export type BaseQuery = { categoryId?: string; q?: string };

/** Фильтры по вариантам (FR-V4): группы значений по свойствам (И между группами, ИЛИ внутри) и цена. */
export type VariantQuery = { groups: string[][]; priceMin?: number; priceMax?: number };

export type ListQuery = BaseQuery & {
  /** `null` — фильтра по вариантам нет: тогда можно показать и закончившиеся (если магазин включил). */
  variants: VariantQuery | null;
  includeOutOfStock: boolean;
  sort: StorefrontSort;
};

export type CardRow = {
  id: string;
  shortId: string;
  slug: string;
  name: string;
  totalStock: number;
  price: number;
  maxPrice: number;
  /** Ключ курсора: `[закончился 0/1, значение порядка]`. */
  sortKey: [number, CursorValue];
};

export type ProductDetailRow = {
  id: string;
  shortId: string;
  slug: string;
  name: string;
  description: string | null;
  categoryId: string | null;
  categoryName: string | null;
};

export type VariantRow = { id: string; productId: string; price: number; stock: number };

export type VariantValueRow = {
  variantId: string;
  attributeId: string;
  attributeName: string;
  attributePosition: number;
  valueId: string;
  value: string;
  valuePosition: number;
};

export type CartVariantRow = VariantRow & {
  shortId: string;
  slug: string;
  name: string;
  isVisible: boolean;
};

const likePattern = (q: string) => `%${q.replace(/[\\%_]/g, '\\$&')}%`;

/**
 * Столбцы товара в коррелированных подзапросах — с именем таблицы явно: в `select` запроса по одной таблице Drizzle
 * пишет столбцы без него, и `"id"` внутри подзапроса по вариантам стал бы id варианта (pitfalls.md).
 */
const PRODUCT_ID = sql.raw('"products"."id"');

/** Цена товара на витрине — по вариантам в наличии; у закончившегося — по всем (решение основателя 2026-11-10). */
const inStockPrice = (fn: 'min' | 'max') =>
  sql<number>`coalesce((select ${sql.raw(fn)}(sv.price) from ${variants} sv where sv.product_id = ${PRODUCT_ID} and sv.stock > 0), ${sql.raw(`"products"."${fn}_price"`)})`;

/** Закончившиеся — в конце при любом порядке (FR-V4): первый ключ порядка. */
const outOfStock = sql<number>`("products"."total_stock" = 0)::int`;

/** Порядки сетки (FR-V5); второй ключ после «закончился» — значение порядка, последний — id. */
const SORTS: Record<StorefrontSort, { expr: SQL; key: SQL; param: (key: CursorValue) => SQL; desc: boolean }> = {
  new: {
    expr: sql`${products.createdAt}`,
    key: sql`"products"."created_at"::text`,
    param: (key) => sql`${String(key)}::timestamptz`,
    desc: true,
  },
  price_asc: { expr: inStockPrice('min'), key: inStockPrice('min'), param: (key) => sql`${Number(key)}::integer`, desc: false },
  price_desc: { expr: inStockPrice('min'), key: inStockPrice('min'), param: (key) => sql`${Number(key)}::integer`, desc: true },
}; // prettier-ignore

/** Видимый на витрине товар: не скрыт и есть хотя бы один вариант. */
function visibleProducts(shopId: string, query: BaseQuery): SQL[] {
  const conditions: SQL[] = [
    eq(products.shopId, shopId),
    eq(products.isVisible, true),
    sql`exists (select 1 from ${variants} sv where sv.product_id = ${PRODUCT_ID})`,
  ];
  if (query.categoryId) {
    conditions.push(
      sql`"products"."category_id" in (select sc.id from ${categories} sc where sc.shop_id = ${shopId} and (sc.id = ${query.categoryId} or sc.parent_id = ${query.categoryId}))`,
    );
  }
  const q = query.q?.trim();
  if (q) conditions.push(ilike(products.name, likePattern(q)));
  return conditions;
}

/** Есть вариант в наличии, подходящий под цену и все группы значений. */
function matchingVariant(query: VariantQuery): SQL {
  const conditions: SQL[] = [sql`sv.product_id = ${PRODUCT_ID}`, sql`sv.stock > 0`];
  if (query.priceMin !== undefined) conditions.push(sql`sv.price >= ${query.priceMin}`);
  if (query.priceMax !== undefined) conditions.push(sql`sv.price <= ${query.priceMax}`);
  for (const ids of query.groups) {
    const values = sql.join(
      ids.map((id) => sql`${id}::uuid`),
      sql`, `,
    );
    conditions.push(
      sql`exists (select 1 from ${variantValues} svv where svv.variant_id = sv.id and svv.attribute_value_id in (${values}))`,
    );
  }
  return sql`exists (select 1 from ${variants} sv where ${sql.join(conditions, sql` and `)})`;
}

function listConditions(shopId: string, query: ListQuery): SQL[] {
  const conditions = visibleProducts(shopId, query);
  if (query.variants) conditions.push(matchingVariant(query.variants));
  else if (!query.includeOutOfStock) conditions.push(gt(products.totalStock, 0));
  return conditions;
}

/**
 * Витрина (FR-V1–V7) — только чтение таблиц магазина и каталога своими запросами (backend-structure.md, раздел 4).
 * Все функции по данным магазина — по `shopId`; магазин находится по поддомену.
 */
export const storefrontRepository = {
  async findShop(db: DbOrTx, subdomain: string): Promise<StorefrontShopRow | null> {
    const [row] = await db.select().from(shops).where(eq(shops.subdomain, subdomain));
    return row ?? null;
  },

  /** Категории с числом товаров витрины прямо в них (те же правила, что у сетки без фильтров). */
  async categoryCounts(db: DbOrTx, shopId: string, includeOutOfStock: boolean): Promise<CategoryCountRow[]> {
    const where = visibleProducts(shopId, {});
    if (!includeOutOfStock) where.push(gt(products.totalStock, 0));
    const counted = db
      .select({ categoryId: products.categoryId, total: sql<number>`count(*)`.as('total') })
      .from(products)
      .where(and(...where))
      .groupBy(products.categoryId)
      .as('counted');
    return db
      .select({
        id: categories.id,
        name: categories.name,
        parentId: categories.parentId,
        position: categories.position,
        productCount: sql<number>`coalesce(${counted.total}, 0)`.mapWith(Number),
      })
      .from(categories)
      .leftJoin(counted, eq(counted.categoryId, categories.id))
      .where(eq(categories.shopId, shopId));
  },

  /** Страница сетки; на одну строку больше — понять, есть ли дальше. */
  async listCards(
    db: DbOrTx,
    shopId: string,
    query: ListQuery,
    cursor: { key: [number, CursorValue]; id: string } | null,
    limit: number,
  ): Promise<CardRow[]> {
    const sort = SORTS[query.sort];
    const where = listConditions(shopId, query);
    if (cursor) {
      const [out, key] = cursor.key;
      const op = sort.desc ? sql`<` : sql`>`;
      where.push(
        sql`(${outOfStock} > ${Number(out)} or (${outOfStock} = ${Number(out)} and (${sort.expr}, ${products.id}) ${op} (${sort.param(key)}, ${cursor.id}::uuid)))`,
      );
    }
    const direction = sort.desc ? sql`desc` : sql`asc`;
    const rows = await db
      .select({
        id: products.id,
        shortId: products.shortId,
        slug: products.slug,
        name: products.name,
        totalStock: products.totalStock,
        price: inStockPrice('min'),
        maxPrice: inStockPrice('max'),
        out: outOfStock,
        key: sort.key,
      })
      .from(products)
      .where(and(...where))
      .orderBy(asc(outOfStock), sql`${sort.expr} ${direction}`, sql`${products.id} ${direction}`)
      .limit(limit + 1);
    return rows.map(({ out, key, ...row }) => ({
      ...row,
      price: Number(row.price),
      maxPrice: Number(row.maxPrice),
      sortKey: [Number(out), typeof key === 'number' ? key : String(key)],
    }));
  },

  /** Закончившиеся товары выборки — для `total` фасетов, когда магазин их показывает. */
  async countOutOfStock(db: DbOrTx, shopId: string, query: BaseQuery): Promise<number> {
    const [row] = await db
      .select({ total: sql<number>`count(*)`.mapWith(Number) })
      .from(products)
      .where(and(...visibleProducts(shopId, query), eq(products.totalStock, 0)));
    return row?.total ?? 0;
  },

  /** Варианты в наличии выборки со значениями свойств — для фасетов (считаются в памяти, `lib/facets.ts`). */
  async facetVariants(db: DbOrTx, shopId: string, query: BaseQuery): Promise<FacetVariant[]> {
    const rows = await db
      .select({
        productId: variants.productId,
        price: variants.price,
        valueIds: sql<
          string[]
        >`coalesce(array_agg(${variantValues.attributeValueId}) filter (where ${variantValues.attributeValueId} is not null), '{}')`,
      })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .leftJoin(variantValues, eq(variantValues.variantId, variants.id))
      .where(and(eq(variants.shopId, shopId), gt(variants.stock, 0), ...visibleProducts(shopId, query)))
      .groupBy(variants.id);
    return rows;
  },

  /** Свойства магазина со значениями в порядке витрины. */
  async attributes(db: DbOrTx, shopId: string): Promise<FacetAttribute[]> {
    const rows = await db
      .select({
        id: attributes.id,
        name: attributes.name,
        inFilters: attributes.inFilters,
        valueId: attributeValues.id,
        value: attributeValues.value,
      })
      .from(attributes)
      .innerJoin(attributeValues, eq(attributeValues.attributeId, attributes.id))
      .where(eq(attributes.shopId, shopId))
      .orderBy(asc(attributes.position), asc(attributes.name), asc(attributeValues.position), asc(attributeValues.id));
    const result: FacetAttribute[] = [];
    for (const row of rows) {
      let attribute = result.at(-1);
      if (attribute?.id !== row.id) {
        attribute = { id: row.id, name: row.name, inFilters: row.inFilters, values: [] };
        result.push(attribute);
      }
      attribute.values.push({ id: row.valueId, value: row.value });
    }
    return result;
  },

  /** Свойство каждого из значений (чужие и несуществующие не вернутся). */
  async attributeOfValues(db: DbOrTx, shopId: string, valueIds: string[]): Promise<Map<string, string>> {
    if (valueIds.length === 0) return new Map();
    const rows = await db
      .select({ id: attributeValues.id, attributeId: attributeValues.attributeId })
      .from(attributeValues)
      .where(and(eq(attributeValues.shopId, shopId), inArray(attributeValues.id, valueIds)));
    return new Map(rows.map((row) => [row.id, row.attributeId]));
  },

  /** Обложки — первое готовое фото каждого товара. */
  async covers(db: DbOrTx, shopId: string, productIds: string[]): Promise<Map<string, StoredImage>> {
    if (productIds.length === 0) return new Map();
    const rows = await db
      .selectDistinctOn([productPhotos.productId], {
        productId: productPhotos.productId,
        sizes: productPhotos.sizes,
        width: productPhotos.width,
        height: productPhotos.height,
      })
      .from(productPhotos)
      .where(readyPhotos(shopId, inArray(productPhotos.productId, productIds)))
      .orderBy(productPhotos.productId, asc(productPhotos.position), asc(productPhotos.id));
    return new Map(rows.map((row) => [row.productId, toStored(row)]));
  },

  /** Готовые фото товара по порядку. */
  async photos(db: DbOrTx, shopId: string, productId: string): Promise<StoredImage[]> {
    const rows = await db
      .select({ sizes: productPhotos.sizes, width: productPhotos.width, height: productPhotos.height })
      .from(productPhotos)
      .where(readyPhotos(shopId, eq(productPhotos.productId, productId)))
      .orderBy(asc(productPhotos.position), asc(productPhotos.id));
    return rows.map(toStored);
  },

  /** Товар виден на витрине этого магазина (для событий статистики). */
  async isVisibleProduct(db: DbOrTx, shopId: string, productId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: products.id })
      .from(products)
      .where(and(...visibleProducts(shopId, {}), eq(products.id, productId)));
    return row !== undefined;
  },

  /** Видимый товар по `shortId` (DM3) с категорией. */
  async findProduct(db: DbOrTx, shopId: string, shortId: string): Promise<ProductDetailRow | null> {
    const [row] = await db
      .select({
        id: products.id,
        shortId: products.shortId,
        slug: products.slug,
        name: products.name,
        description: products.description,
        categoryId: products.categoryId,
        categoryName: categories.name,
      })
      .from(products)
      .leftJoin(categories, eq(categories.id, products.categoryId))
      .where(and(...visibleProducts(shopId, {}), eq(products.shortId, shortId)));
    return row ?? null;
  },

  async variants(db: DbOrTx, shopId: string, productId: string): Promise<VariantRow[]> {
    return db
      .select({ id: variants.id, productId: variants.productId, price: variants.price, stock: variants.stock })
      .from(variants)
      .where(and(eq(variants.shopId, shopId), eq(variants.productId, productId)))
      .orderBy(asc(variants.position), asc(variants.id));
  },

  /** Значения свойств вариантов с порядком свойства и значения. */
  async variantValues(db: DbOrTx, shopId: string, variantIds: string[]): Promise<VariantValueRow[]> {
    if (variantIds.length === 0) return [];
    return db
      .select({
        variantId: variantValues.variantId,
        attributeId: attributes.id,
        attributeName: attributes.name,
        attributePosition: attributes.position,
        valueId: attributeValues.id,
        value: attributeValues.value,
        valuePosition: attributeValues.position,
      })
      .from(variantValues)
      .innerJoin(attributeValues, eq(attributeValues.id, variantValues.attributeValueId))
      .innerJoin(attributes, eq(attributes.id, attributeValues.attributeId))
      .where(and(eq(attributeValues.shopId, shopId), inArray(variantValues.variantId, variantIds)))
      .orderBy(asc(attributes.position), asc(attributes.name), asc(attributeValues.position), asc(attributeValues.id));
  },

  /** Варианты корзины с товаром (скрытый тоже — сервис ответит `unavailable`). */
  async cartVariants(db: DbOrTx, shopId: string, variantIds: string[]): Promise<CartVariantRow[]> {
    if (variantIds.length === 0) return [];
    return db
      .select({
        id: variants.id,
        productId: variants.productId,
        price: variants.price,
        stock: variants.stock,
        shortId: products.shortId,
        slug: products.slug,
        name: products.name,
        isVisible: products.isVisible,
      })
      .from(variants)
      .innerJoin(products, eq(products.id, variants.productId))
      .where(and(eq(variants.shopId, shopId), inArray(variants.id, variantIds)));
  },
};

function readyPhotos(shopId: string, condition: SQL): SQL {
  return and(eq(productPhotos.shopId, shopId), eq(productPhotos.status, 'ready'), condition)!;
}

function toStored(row: {
  sizes: StoredImage['sizes'] | null;
  width: number | null;
  height: number | null;
}): StoredImage {
  return { sizes: row.sizes!, width: row.width!, height: row.height! };
}
