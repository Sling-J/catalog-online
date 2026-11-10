import type {
  CheckStorefrontCartData,
  CheckStorefrontCartResponse,
  GetStorefrontFacetsData,
  ListStorefrontProductsData,
  ListStorefrontProductsResponse,
  StorefrontCategory,
  StorefrontFacets,
  StorefrontProduct,
  StorefrontShop,
} from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import { PreviewTokens } from '../../core/auth/index.js';
import { InjectDb, type Db } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { Images } from '../../core/images/index.js';
import { decodeCursor, encodeCursor } from '../../core/pagination/index.js';
import { storefrontCategoryTree } from './lib/categories.js';
import { computeFacets, groupValues, hasVariantFilter } from './lib/facets.js';
import { variantLabel } from './lib/stock.js';
import { toCard, toGoneShop, toStorefrontProduct, toStorefrontShop, type ToImage } from './storefront.mapper.js';
import { storefrontRepository, type ListQuery, type StorefrontShopRow } from './storefront.repository.js';

const DEFAULT_LIMIT = 30;

type ProductFilters = Omit<NonNullable<GetStorefrontFacetsData['query']>, 'preview'>;

/** Открытая витрина: магазин и открыт ли он по токену превью. */
export type OpenShop = { shop: StorefrontShopRow; isPreview: boolean };

/**
 * Публичная витрина (FR-V1–V7). Каждый запрос начинается с магазина по поддомену (backend-structure.md,
 * раздел 6): опубликованный открыт всем, черновик — по токену превью своего магазина (A7), заблокированный — никому.
 * Дальше — только данные этого магазина.
 */
@Injectable()
export class StorefrontService {
  private readonly toImage: ToImage;

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly previewTokens: PreviewTokens,
    images: Images,
  ) {
    this.toImage = (image) => images.toImage(image);
  }

  /** Магазин витрины или 404 — для всех запросов, кроме самого магазина (у него 410 с контактами). */
  async open(subdomain: string, preview: string | undefined): Promise<OpenShop> {
    const shop = await storefrontRepository.findShop(this.db, subdomain);
    const opened = shop && this.access(shop, preview);
    if (!opened) throw new AppError('not_found', 404);
    return opened;
  }

  /**
   * Шапка и «О магазине» (FR-V1). Снятый с публикации — 410 `shop_hidden`, заблокированный — 410 `shop_blocked`,
   * оба с контактами для заглушки. Ни разу не публиковавшийся черновик — 404: покупателю он не знаком, а контактов
   * для заглушки может ещё не быть.
   */
  async shop(subdomain: string, preview: string | undefined): Promise<StorefrontShop> {
    const shop = await storefrontRepository.findShop(this.db, subdomain);
    if (!shop) throw new AppError('not_found', 404);
    const opened = this.access(shop, preview);
    if (opened) return toStorefrontShop(shop, opened.isPreview, this.toImage);
    if (shop.publishedAt && shop.name && shop.whatsapp) {
      throw new AppError(shop.status === 'blocked' ? 'shop_blocked' : 'shop_hidden', 410, {
        extra: { shop: toGoneShop(shop, this.toImage) },
      });
    }
    throw new AppError('not_found', 404);
  }

  /** Категории с товарами витрины (FR-V2); закончившиеся считаются, только если магазин их показывает. */
  async categories({ shop }: OpenShop): Promise<StorefrontCategory[]> {
    return storefrontCategoryTree(await storefrontRepository.categoryCounts(this.db, shop.id, shop.showOutOfStock));
  }

  /**
   * Сетка (FR-V3–V5). Товар попадает в выборку, если у него есть вариант в наличии под фильтр. Закончившиеся —
   * только если магазин их показывает и фильтра по вариантам нет, всегда в конце (решение основателя 2026-11-10).
   */
  async products(
    { shop }: OpenShop,
    query: NonNullable<ListStorefrontProductsData['query']>,
  ): Promise<ListStorefrontProductsResponse> {
    const sort = query.sort ?? 'new';
    const limit = query.limit ?? DEFAULT_LIMIT;
    const cursor = query.cursor ? decodeCursor(query.cursor, sort, 2) : null;
    const listQuery: ListQuery = { ...(await this.filters(shop, query)), sort };
    const rows = await storefrontRepository.listCards(
      this.db,
      shop.id,
      listQuery,
      cursor ? { key: [Number(cursor.key[0]), cursor.key[1]!], id: cursor.id } : null,
      limit,
    );
    const page = rows.slice(0, limit);
    const covers = await storefrontRepository.covers(
      this.db,
      shop.id,
      page.map((row) => row.id),
    );
    const last = page.at(-1);
    return {
      items: page.map((row) => toCard(row, covers.get(row.id), shop.lowStockThreshold, this.toImage)),
      nextCursor: rows.length > limit && last ? encodeCursor({ sort, key: last.sortKey, id: last.id }) : null,
    };
  }

  /** Фасеты (FR-V4): по вариантам в наличии той же выборки, считаются в памяти (`lib/facets.ts`). */
  async facets({ shop }: OpenShop, query: ProductFilters): Promise<StorefrontFacets> {
    const base = { categoryId: query.categoryId, q: query.q };
    const filters = { valueIds: query.values ?? [], priceMin: query.priceMin, priceMax: query.priceMax };
    const [variants, attributes] = await Promise.all([
      storefrontRepository.facetVariants(this.db, shop.id, base),
      storefrontRepository.attributes(this.db, shop.id),
    ]);
    const facets = computeFacets(variants, attributes, filters);
    const attributeOf = new Map(attributes.flatMap((a) => a.values.map((v) => [v.id, a.id] as const)));
    if (shop.showOutOfStock && !hasVariantFilter(groupValues(filters.valueIds, attributeOf), filters)) {
      facets.total += await storefrontRepository.countOutOfStock(this.db, shop.id, base);
    }
    return facets;
  }

  /** Карточка по `shortId` (FR-V6, DM3); закончившийся товар тоже отдаётся — витрина покажет «Закончился». */
  async product({ shop }: OpenShop, shortId: string): Promise<StorefrontProduct> {
    const row = await storefrontRepository.findProduct(this.db, shop.id, shortId);
    if (!row) throw new AppError('not_found', 404);
    const [variants, photos] = await Promise.all([
      storefrontRepository.variants(this.db, shop.id, row.id),
      storefrontRepository.photos(this.db, shop.id, row.id),
    ]);
    const values = await storefrontRepository.variantValues(
      this.db,
      shop.id,
      variants.map((variant) => variant.id),
    );
    return toStorefrontProduct(row, variants, values, photos, shop, this.toImage);
  }

  /**
   * Перепроверка корзины (FR-V7, `api.md` «Уточнения контракта»): `ok` / `out_of_stock` / `unavailable` с текущей
   * ценой и количеством, урезанным до остатка. Скрытый, удалённый или чужой вариант — `unavailable`. Итог — по
   * позициям, которые можно заказать.
   */
  async checkCart({ shop }: OpenShop, body: CheckStorefrontCartData['body']): Promise<CheckStorefrontCartResponse> {
    const ids = [...new Set(body.items.map((item) => item.variantId))];
    const found = new Map(
      (await storefrontRepository.cartVariants(this.db, shop.id, ids))
        .filter((row) => row.isVisible)
        .map((row) => [row.id, row]),
    );
    const [values, covers] = await Promise.all([
      storefrontRepository.variantValues(this.db, shop.id, [...found.keys()]),
      storefrontRepository.covers(this.db, shop.id, [...new Set([...found.values()].map((row) => row.productId))]),
    ]);
    let total = 0;
    const items = body.items.map((item): CheckStorefrontCartResponse['items'][number] => {
      const variant = found.get(item.variantId);
      if (!variant) {
        return { variantId: item.variantId, status: 'unavailable', quantity: 0, price: null, product: null };
      }
      const quantity = Math.min(item.quantity, variant.stock);
      total += quantity * variant.price;
      const cover = covers.get(variant.productId);
      return {
        variantId: item.variantId,
        status: quantity > 0 ? 'ok' : 'out_of_stock',
        quantity,
        price: variant.price,
        product: {
          shortId: variant.shortId,
          slug: variant.slug,
          name: variant.name,
          variantLabel: variantLabel(values.filter((value) => value.variantId === variant.id)),
          cover: cover ? this.toImage(cover) : null,
        },
      };
    });
    return { items, total };
  }

  /** Опубликованный — всем; черновик — по действующему токену превью этого магазина; заблокированный — никому. */
  private access(shop: StorefrontShopRow, preview: string | undefined): OpenShop | null {
    if (shop.status === 'published') return { shop, isPreview: false };
    if (shop.status === 'draft' && preview && this.previewTokens.verify(preview) === shop.id) {
      return { shop, isPreview: true };
    }
    return null;
  }

  /** Фильтры запроса → условия выборки: значения свойств группируются по свойствам своего магазина. */
  private async filters(shop: StorefrontShopRow, query: ProductFilters): Promise<Omit<ListQuery, 'sort'>> {
    const valueIds = query.values ?? [];
    const groups = groupValues(valueIds, await storefrontRepository.attributeOfValues(this.db, shop.id, valueIds));
    const filters = { valueIds, priceMin: query.priceMin, priceMax: query.priceMax };
    return {
      categoryId: query.categoryId,
      q: query.q,
      variants: hasVariantFilter(groups, filters)
        ? { groups: [...groups.values()], priceMin: query.priceMin, priceMax: query.priceMax }
        : null,
      includeOutOfStock: shop.showOutOfStock,
    };
  }
}
