import type {
  StaffBlockShopData,
  StaffImpersonateShopData,
  StaffListShopsData,
  StaffListShopsResponse,
  StaffLoginData,
  StaffUnblockShopData,
} from '@catalog/contract';
import type { StaffControllerMethods } from '@catalog/contract/nest';
import { zStaffBlockShopBody, zStaffListShopsQuery, zStaffLoginBody } from '@catalog/contract/zod';
import { Body, Controller, Get, HttpCode, Param, Post, Query } from '@nestjs/common';

import { StaffAuthenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { PathIds } from '../../core/pagination/index.js';
import { RateLimit } from '../../core/rate-limit/index.js';
import { StaffService } from './staff.service.js';

const MINUTE = 60_000;

/** `/v1/staff/*` (контракт, тег staff). Сотрудник — из cookie `staff_sid`, кроме входа. */
@Controller('v1/staff')
export class StaffController implements StaffControllerMethods {
  constructor(
    private readonly staff: StaffService,
    private readonly ctx: RequestContext,
  ) {}

  @Post('login')
  @HttpCode(204)
  @RateLimit(10, MINUTE)
  staffLogin(@Body({ schema: zStaffLoginBody }) body: StaffLoginData['body']): Promise<void> {
    return this.staff.login(body);
  }

  @Get('shops')
  @StaffAuthenticated()
  staffListShops(
    @Query({ schema: zStaffListShopsQuery }) query?: StaffListShopsData['query'],
  ): Promise<StaffListShopsResponse> {
    return this.staff.listShops(query ?? {});
  }

  @Post('shops/:shopId/block')
  @HttpCode(204)
  @StaffAuthenticated()
  staffBlockShop(
    @Param(PathIds) path: StaffBlockShopData['path'],
    // тело необязательное (причина)
    @Body({ schema: zStaffBlockShopBody.optional() }) body?: StaffBlockShopData['body'],
  ): Promise<void> {
    return this.staff.block(this.ctx.staffId(), path.shopId, body?.reason);
  }

  @Post('shops/:shopId/unblock')
  @HttpCode(204)
  @StaffAuthenticated()
  staffUnblockShop(@Param(PathIds) path: StaffUnblockShopData['path']): Promise<void> {
    return this.staff.unblock(this.ctx.staffId(), path.shopId);
  }

  @Post('shops/:shopId/impersonate')
  @HttpCode(204)
  @StaffAuthenticated()
  staffImpersonateShop(@Param(PathIds) path: StaffImpersonateShopData['path']): Promise<void> {
    return this.staff.impersonate(this.ctx.staffId(), path.shopId);
  }
}
