import type {
  BulkUpdateProductsData,
  ListProductsData,
  ListProductsResponse,
  Product,
  ProductCreate,
  ProductUpdate,
  VariantInput,
} from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import { InjectDb, isUniqueViolation, type Db, type DbOrTx } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { Images } from '../../core/images/index.js';
import { decodeCursor, encodeCursor } from '../../core/pagination/index.js';
import { CategoriesService } from '../categories/categories.service.js';
import { newShortId, slugify } from './lib/slug.js';
import { ProductPhotosService } from './product-photos.service.js';
import { productPhotosRepository } from './product-photos.repository.js';
import { ProductVariantsService } from './product-variants.service.js';
import { toListItem, toProduct, type ToImage } from './products.mapper.js';
import {
  productsRepository,
  type ProductCounts,
  type ProductRow,
  type ReadinessCounts,
} from './products.repository.js';
import { variantsRepository } from './variants.repository.js';

const DEFAULT_LIMIT = 30;

/** Товары магазина (FR-A5): список, карточка, таблица размеров, массовые действия, счётчики. */
@Injectable()
export class ProductsService {
  private readonly toImage: ToImage;

  constructor(
    @InjectDb() private readonly db: Db,
    images: Images,
    private readonly variants: ProductVariantsService,
    private readonly photos: ProductPhotosService,
    private readonly categories: CategoriesService,
  ) {
    this.toImage = (image) => images.toImage(image);
  }

  /** Страница списка (API3): закладка курсора, `total` — сколько всего в выборке. */
  async list(shopId: string, query: NonNullable<ListProductsData['query']>): Promise<ListProductsResponse> {
    const listQuery = {
      q: query.q,
      categoryId: query.categoryId,
      filter: query.filter ?? 'all',
      sort: query.sort ?? 'new',
    };
    const limit = query.limit ?? DEFAULT_LIMIT;
    const cursor = query.cursor ? decodeCursor(query.cursor, listQuery.sort) : null;
    const [rows, total] = await Promise.all([
      productsRepository.list(this.db, shopId, listQuery, cursor, limit),
      productsRepository.countList(this.db, shopId, listQuery),
    ]);
    const page = rows.slice(0, limit);
    const ids = page.map((row) => row.id);
    const [variants, photos] = await Promise.all([
      variantsRepository.listForProducts(this.db, shopId, ids),
      productPhotosRepository.listForProducts(this.db, shopId, ids),
    ]);
    const last = page.at(-1);
    return {
      items: page.map((row) =>
        toListItem(
          row,
          variants.filter((variant) => variant.productId === row.id),
          photos.filter((photo) => photo.productId === row.id),
          this.toImage,
        ),
      ),
      nextCursor:
        rows.length > limit && last ? encodeCursor({ sort: listQuery.sort, key: last.sortKey, id: last.id }) : null,
      total,
    };
  }

  counts(shopId: string): Promise<ProductCounts> {
    return productsRepository.counts(this.db, shopId);
  }

  /** Числа для чек-листа магазина (модуль магазина, публикация — в своей транзакции `tx`). */
  readiness(shopId: string, tx?: DbOrTx): Promise<ReadinessCounts> {
    return productsRepository.readiness(tx ?? this.db, shopId);
  }

  async get(shopId: string, productId: string): Promise<Product> {
    const row = await productsRepository.find(this.db, shopId, productId);
    if (!row) throw new AppError('not_found', 404);
    return this.present(this.db, shopId, row);
  }

  /**
   * Новый товар: таблица размеров и фото из загрузок — одной транзакцией. Адрес на витрине — slug из названия и
   * свободный в магазине `shortId`.
   */
  async create(shopId: string, body: ProductCreate): Promise<Product> {
    const name = this.requireName(body.name);
    const description = body.description?.trim() || null;
    const categoryId = body.categoryId ?? null;
    return this.writing(() =>
      this.db.transaction(async (tx) => {
        await this.checkCategory(tx, shopId, categoryId);
        const product = await productsRepository.insert(tx, shopId, {
          name,
          description,
          categoryId,
          isVisible: body.isVisible ?? true,
          slug: slugify(name),
          shortId: await this.freeShortId(tx, shopId),
        });
        await this.variants.replace(tx, shopId, product, body.variants);
        await this.photos.attach(tx, shopId, product.id, body.photoUploadIds ?? [], 0);
        return this.present(tx, shopId, (await productsRepository.find(tx, shopId, product.id))!);
      }),
    );
  }

  /** Только переданные поля; новое название — новый slug (старые ссылки ведут по `shortId`, DM3). */
  async update(shopId: string, productId: string, body: ProductUpdate): Promise<Product> {
    const patch: Parameters<typeof productsRepository.update>[3] = {};
    if (body.name !== undefined) {
      patch.name = this.requireName(body.name);
      patch.slug = slugify(patch.name);
    }
    if (body.description !== undefined) patch.description = body.description?.trim() || null;
    if (body.isVisible !== undefined) patch.isVisible = body.isVisible;
    if (body.categoryId !== undefined) {
      await this.checkCategory(this.db, shopId, body.categoryId);
      patch.categoryId = body.categoryId;
    }
    const row = Object.keys(patch).length
      ? await productsRepository.update(this.db, shopId, productId, patch)
      : await productsRepository.find(this.db, shopId, productId);
    if (!row) throw new AppError('not_found', 404);
    return this.present(this.db, shopId, row);
  }

  async replaceVariants(shopId: string, productId: string, inputs: VariantInput[]): Promise<Product> {
    return this.writing(() =>
      this.db.transaction(async (tx) => {
        const product = await productsRepository.findForUpdate(tx, shopId, productId);
        if (!product) throw new AppError('not_found', 404);
        await this.variants.replace(tx, shopId, product, inputs);
        return this.present(tx, shopId, (await productsRepository.find(tx, shopId, productId))!);
      }),
    );
  }

  /** Удалить товар с вариантами и фото; файлы фото — после записи в базу. */
  async delete(shopId: string, productId: string): Promise<void> {
    const photos = await this.db.transaction(async (tx) => {
      const product = await productsRepository.findForUpdate(tx, shopId, productId);
      if (!product) throw new AppError('not_found', 404);
      const rows = await productPhotosRepository.listForProducts(tx, shopId, [productId]);
      await productsRepository.delete(tx, shopId, productId);
      return rows;
    });
    await this.photos.removeFiles(photos);
  }

  /** Скрыть, показать, сменить категорию; чужие и несуществующие id пропускаются. */
  async bulk(shopId: string, body: BulkUpdateProductsData['body']): Promise<{ updated: number }> {
    const ids = [...new Set(body.productIds)];
    if (body.action === 'set_category') {
      if (body.categoryId === undefined) {
        throw new AppError('validation_failed', 422, { errors: [{ field: 'categoryId', code: 'required' }] });
      }
      await this.checkCategory(this.db, shopId, body.categoryId);
      return { updated: await productsRepository.setCategory(this.db, shopId, ids, body.categoryId) };
    }
    return { updated: await productsRepository.setVisibility(this.db, shopId, ids, body.action === 'show') };
  }

  private async present(db: DbOrTx, shopId: string, row: ProductRow): Promise<Product> {
    const [variants, photos] = await Promise.all([
      variantsRepository.listForProducts(db, shopId, [row.id]),
      productPhotosRepository.listForProducts(db, shopId, [row.id]),
    ]);
    const values = await variantsRepository.valuesForVariants(
      db,
      shopId,
      variants.map((variant) => variant.id),
    );
    return toProduct(row, variants, values, photos, this.toImage);
  }

  private requireName(value: string): string {
    const name = value.trim();
    if (!name) throw new AppError('validation_failed', 422, { errors: [{ field: 'name', code: 'required' }] });
    return name;
  }

  private async checkCategory(db: DbOrTx, shopId: string, categoryId: string | null): Promise<void> {
    if (categoryId && !(await this.categories.exists(shopId, categoryId, db))) {
      throw new AppError('validation_failed', 422, { errors: [{ field: 'categoryId', code: 'not_found' }] });
    }
  }

  private async freeShortId(db: DbOrTx, shopId: string): Promise<string> {
    for (;;) {
      const shortId = newShortId();
      if (!(await productsRepository.isShortIdTaken(db, shopId, shortId))) return shortId;
    }
  }

  /** Артикул занял кто-то параллельно (или повтор с сохранённым артикулом строки) — 409 `sku_taken`. */
  private async writing<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (isUniqueViolation(error)) throw new AppError('sku_taken', 409);
      throw error;
    }
  }
}
