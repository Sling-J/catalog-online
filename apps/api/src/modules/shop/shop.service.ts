import { Injectable } from '@nestjs/common';
import type { Shop, ShopUpdate } from '@catalog/contract';

import { PreviewTokens } from '../../core/auth/index.js';
import { InjectDb, isUniqueViolation, type Db, type DbOrTx } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { computeReadiness } from './lib/readiness.js';
import { prepareShopPatch } from './lib/shop-update.js';
import { subdomainProblem } from './lib/subdomain.js';
import { toShop } from './shop.mapper.js';
import { shopRepository, type ShopRow } from './shop.repository.js';

export type SubdomainCheck = { available: boolean; reason: 'taken' | 'reserved' | 'invalid' | null };

/** Магазин владельца (FR-A2, FR-A8, FR-A9): настройки, адрес витрины, публикация, чек-лист, превью. */
@Injectable()
export class ShopService {
  constructor(
    @InjectDb() private readonly db: Db,
    private readonly previewTokens: PreviewTokens,
  ) {}

  async get(shopId: string): Promise<Shop> {
    return this.present(this.db, await this.load(this.db, shopId));
  }

  /** Мастер и «О магазине»: только переданные поля. Адрес витрины — проверка формата, служебных слов и занятости. */
  async update(shopId: string, body: ShopUpdate): Promise<Shop> {
    const { patch, errors } = prepareShopPatch(body);
    if (errors.length) throw new AppError('validation_failed', 422, { errors });
    if (patch.subdomain !== undefined) {
      const problem = subdomainProblem(patch.subdomain);
      if (problem === 'invalid') {
        throw new AppError('validation_failed', 422, { errors: [{ field: 'subdomain', code: 'invalid_format' }] });
      }
      if (problem === 'reserved') throw new AppError('subdomain_reserved', 409);
      if (await shopRepository.isSubdomainTaken(this.db, shopId, patch.subdomain)) {
        throw new AppError('subdomain_taken', 409);
      }
    }
    let row: ShopRow | null;
    try {
      row = await shopRepository.update(this.db, shopId, patch);
    } catch (error) {
      // двое заняли один адрес одновременно — уникальный индекс
      if (isUniqueViolation(error)) throw new AppError('subdomain_taken', 409);
      throw error;
    }
    if (!row) throw new AppError('not_found', 404);
    return this.present(this.db, row);
  }

  /** Свободен ли адрес; свой нынешний — свободен (мастер, шаг 2). */
  async checkSubdomain(shopId: string, value: string): Promise<SubdomainCheck> {
    const problem = subdomainProblem(value);
    if (problem) return { available: false, reason: problem };
    const taken = await shopRepository.isSubdomainTaken(this.db, shopId, value);
    return taken ? { available: false, reason: 'taken' } : { available: true, reason: null };
  }

  /**
   * Публикация: заблокированный — 409 `shop_blocked`; без названия, адреса, WhatsApp, видимого товара или
   * подтверждённой почты — 409 `shop_not_ready` (A9). Повторная публикация обновляет `publishedAt`.
   */
  async publish(shopId: string): Promise<Shop> {
    return this.db.transaction(async (tx) => {
      const shop = await this.load(tx, shopId);
      if (shop.status === 'blocked') throw new AppError('shop_blocked', 409);
      const readiness = computeReadiness(shop, await shopRepository.productCounts(tx, shopId));
      if (!readiness.canPublish || !(await shopRepository.isEmailVerified(tx, shopId))) {
        throw new AppError('shop_not_ready', 409);
      }
      const row = await shopRepository.setStatus(tx, shopId, 'published', new Date());
      return toShop(row!, readiness);
    });
  }

  /** Снять с публикации. Заблокированный остаётся заблокированным, черновик — черновиком. */
  async unpublish(shopId: string): Promise<Shop> {
    const shop = await this.load(this.db, shopId);
    if (shop.status !== 'published') return this.present(this.db, shop);
    const row = await shopRepository.setStatus(this.db, shopId, 'draft');
    return this.present(this.db, row!);
  }

  /** Загрузка логотипа — в T-406; до появления загрузок (T-405) любой `uploadId` не найден. */
  setLogo(): never {
    throw new AppError('upload_not_found', 422);
  }

  async deleteLogo(shopId: string): Promise<void> {
    await shopRepository.clearLogo(this.db, shopId);
  }

  /**
   * Токен превью неопубликованной витрины (A7). Выдаём любому магазину: заблокированный витрина не покажет и по
   * токену (T-410), а в контракте у этого запроса нет ответа с ошибкой.
   */
  createPreviewToken(shopId: string): { token: string; expiresAt: string } {
    const { token, expiresAt } = this.previewTokens.issue(shopId);
    return { token, expiresAt: expiresAt.toISOString() };
  }

  private async load(db: DbOrTx, shopId: string): Promise<ShopRow> {
    const row = await shopRepository.findById(db, shopId);
    if (!row) throw new AppError('not_found', 404);
    return row;
  }

  private async present(db: DbOrTx, row: ShopRow): Promise<Shop> {
    return toShop(row, computeReadiness(row, await shopRepository.productCounts(db, row.id)));
  }
}
