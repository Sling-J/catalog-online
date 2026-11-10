import type {
  CheckStorefrontCartData,
  CheckStorefrontCartResponse,
  GetStorefrontFacetsData,
  GetStorefrontProductData,
  GetStorefrontShopData,
  ListStorefrontCategoriesData,
  ListStorefrontProductsData,
  ListStorefrontProductsResponse,
  StorefrontCategory,
  StorefrontFacets,
  StorefrontProduct,
  StorefrontShop,
  TrackStorefrontEventData,
} from '@catalog/contract';
import type { StorefrontControllerMethods } from '@catalog/contract/nest';
import {
  zCheckStorefrontCartBody,
  zCheckStorefrontCartQuery,
  zGetStorefrontFacetsQuery,
  zGetStorefrontProductQuery,
  zGetStorefrontShopQuery,
  zListStorefrontCategoriesQuery,
  zListStorefrontProductsQuery,
  zTrackStorefrontEventBody,
} from '@catalog/contract/zod';
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';

import { RequestContext } from '../../core/context/index.js';
import { RateLimit } from '../../core/rate-limit/index.js';
import { StorefrontService } from './storefront.service.js';

const MINUTE = 60_000;

/**
 * `/v1/storefront/{subdomain}/…` (контракт, тег storefront) — публично, без входа (API1). Поддомен и `shortId` без
 * схемы: неверный формат — такого магазина или товара нет, 404.
 */
@Controller('v1/storefront/:subdomain')
export class StorefrontController implements StorefrontControllerMethods {
  constructor(
    private readonly storefront: StorefrontService,
    private readonly ctx: RequestContext,
  ) {}

  @Get()
  getStorefrontShop(
    @Param() path: GetStorefrontShopData['path'],
    @Query({ schema: zGetStorefrontShopQuery }) query?: GetStorefrontShopData['query'],
  ): Promise<StorefrontShop> {
    return this.storefront.shop(path.subdomain, query?.preview);
  }

  @Get('categories')
  async listStorefrontCategories(
    @Param() path: ListStorefrontCategoriesData['path'],
    @Query({ schema: zListStorefrontCategoriesQuery }) query?: ListStorefrontCategoriesData['query'],
  ): Promise<StorefrontCategory[]> {
    return this.storefront.categories(await this.storefront.open(path.subdomain, query?.preview));
  }

  @Get('products')
  async listStorefrontProducts(
    @Param() path: ListStorefrontProductsData['path'],
    @Query({ schema: zListStorefrontProductsQuery }) query?: ListStorefrontProductsData['query'],
  ): Promise<ListStorefrontProductsResponse> {
    return this.storefront.products(await this.storefront.open(path.subdomain, query?.preview), query ?? {});
  }

  @Get('facets')
  async getStorefrontFacets(
    @Param() path: GetStorefrontFacetsData['path'],
    @Query({ schema: zGetStorefrontFacetsQuery }) query?: GetStorefrontFacetsData['query'],
  ): Promise<StorefrontFacets> {
    return this.storefront.facets(await this.storefront.open(path.subdomain, query?.preview), query ?? {});
  }

  @Get('products/:shortId')
  async getStorefrontProduct(
    @Param() path: GetStorefrontProductData['path'],
    @Query({ schema: zGetStorefrontProductQuery }) query?: GetStorefrontProductData['query'],
  ): Promise<StorefrontProduct> {
    return this.storefront.product(await this.storefront.open(path.subdomain, query?.preview), path.shortId);
  }

  @Post('cart/check')
  @HttpCode(200)
  async checkStorefrontCart(
    @Param() path: CheckStorefrontCartData['path'],
    @Body({ schema: zCheckStorefrontCartBody }) body: CheckStorefrontCartData['body'],
    @Query({ schema: zCheckStorefrontCartQuery }) query?: CheckStorefrontCartData['query'],
  ): Promise<CheckStorefrontCartResponse> {
    return this.storefront.checkCart(await this.storefront.open(path.subdomain, query?.preview), body);
  }

  /**
   * Просмотр или «Заказать через WhatsApp» для статистики (FR-A10). Ответ всегда 204 — и когда событие отброшено
   * (робот, магазин закрыт, чужой товар). Строгий лимит частоты с IP — api.md.
   */
  @Post('events')
  @HttpCode(204)
  @RateLimit(60, MINUTE)
  trackStorefrontEvent(
    @Param() path: TrackStorefrontEventData['path'],
    @Body({ schema: zTrackStorefrontEventBody }) body: TrackStorefrontEventData['body'],
  ): Promise<void> {
    return this.storefront.track(path.subdomain, body, this.ctx.userAgent());
  }
}
