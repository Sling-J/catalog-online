import type { CreateUploadData, Upload } from '@catalog/contract';
import type { UploadsControllerMethods } from '@catalog/contract/nest';
import { zCreateUploadBody } from '@catalog/contract/zod';
import { Body, Controller, Post } from '@nestjs/common';

import { Authenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { RateLimit } from '../../core/rate-limit/index.js';
import { UploadsService } from './uploads.service.js';

/** `/v1/admin/uploads` (контракт, тег uploads). */
@Controller('v1/admin/uploads')
@Authenticated()
export class UploadsController implements UploadsControllerMethods {
  constructor(
    private readonly uploads: UploadsService,
    private readonly ctx: RequestContext,
  ) {}

  /** Фото грузят пачками (до 10 на товар, быстрый режим «Добавить фото») — лимит щедрый, но не бесконечный. */
  @Post()
  @RateLimit(120, 60_000)
  createUpload(@Body({ schema: zCreateUploadBody }) body: CreateUploadData['body']): Promise<Upload> {
    return this.uploads.create(this.ctx.shopId(), body);
  }
}
