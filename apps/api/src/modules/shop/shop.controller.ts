import type {
  CheckSubdomainData,
  CheckSubdomainResponse,
  CreatePreviewTokenResponse,
  SetShopLogoData,
  Shop,
  UpdateShopData,
} from '@catalog/contract';
import type { ShopControllerMethods } from '@catalog/contract/nest';
import { zSetShopLogoBody, zUpdateShopBody } from '@catalog/contract/zod';
import { Body, Controller, Delete, Get, HttpCode, Patch, Post, Put, Query } from '@nestjs/common';

import { Authenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { ShopService } from './shop.service.js';

/** `/v1/admin/shop*` и `/v1/admin/preview-token` (контракт, тег shop). Магазин — из сессии (API1). */
@Controller('v1/admin')
@Authenticated()
export class ShopController implements ShopControllerMethods {
  constructor(
    private readonly shop: ShopService,
    private readonly ctx: RequestContext,
  ) {}

  @Get('shop')
  getShop(): Promise<Shop> {
    return this.shop.get(this.ctx.shopId());
  }

  @Patch('shop')
  updateShop(@Body({ schema: zUpdateShopBody }) body: UpdateShopData['body']): Promise<Shop> {
    return this.shop.update(this.ctx.shopId(), body);
  }

  /**
   * Без схемы в декораторе: неверный формат — это ответ `reason: invalid`, а не 422 (мастер проверяет адрес на лету).
   */
  @Get('shop/subdomain-availability')
  checkSubdomain(@Query() query: CheckSubdomainData['query']): Promise<CheckSubdomainResponse> {
    const value = typeof query?.value === 'string' ? query.value : '';
    return this.shop.checkSubdomain(this.ctx.shopId(), value);
  }

  @Post('shop/publish')
  @HttpCode(200)
  publishShop(): Promise<Shop> {
    return this.shop.publish(this.ctx.shopId());
  }

  @Post('shop/unpublish')
  @HttpCode(200)
  unpublishShop(): Promise<Shop> {
    return this.shop.unpublish(this.ctx.shopId());
  }

  @Put('shop/logo')
  setShopLogo(@Body({ schema: zSetShopLogoBody }) body: SetShopLogoData['body']): Promise<Shop> {
    return this.shop.setLogo(this.ctx.shopId(), body.uploadId);
  }

  @Delete('shop/logo')
  @HttpCode(204)
  deleteShopLogo(): Promise<void> {
    return this.shop.deleteLogo(this.ctx.shopId());
  }

  @Post('preview-token')
  async createPreviewToken(): Promise<CreatePreviewTokenResponse> {
    return this.shop.createPreviewToken(this.ctx.shopId());
  }
}
