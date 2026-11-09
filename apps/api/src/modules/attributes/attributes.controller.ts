import type {
  Attribute,
  CreateAttributeData,
  DeleteAttributeData,
  ListAttributesResponse,
  ReplaceAttributeValuesData,
  UpdateAttributeData,
} from '@catalog/contract';
import type { AttributesControllerMethods } from '@catalog/contract/nest';
import { zCreateAttributeBody, zReplaceAttributeValuesBody, zUpdateAttributeBody } from '@catalog/contract/zod';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';

import { Authenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { PathIds } from '../../core/pagination/index.js';
import { AttributesService } from './attributes.service.js';

/** `/v1/admin/attributes*` (контракт, тег attributes). Магазин — из сессии (API1). */
@Controller('v1/admin/attributes')
@Authenticated()
export class AttributesController implements AttributesControllerMethods {
  constructor(
    private readonly attributes: AttributesService,
    private readonly ctx: RequestContext,
  ) {}

  @Get()
  listAttributes(): Promise<ListAttributesResponse> {
    return this.attributes.list(this.ctx.shopId());
  }

  @Post()
  createAttribute(@Body({ schema: zCreateAttributeBody }) body: CreateAttributeData['body']): Promise<Attribute> {
    return this.attributes.create(this.ctx.shopId(), body);
  }

  @Patch(':attributeId')
  updateAttribute(
    @Param(PathIds) path: UpdateAttributeData['path'],
    @Body({ schema: zUpdateAttributeBody }) body: UpdateAttributeData['body'],
  ): Promise<Attribute> {
    return this.attributes.update(this.ctx.shopId(), path.attributeId, body);
  }

  @Delete(':attributeId')
  @HttpCode(204)
  deleteAttribute(@Param(PathIds) path: DeleteAttributeData['path']): Promise<void> {
    return this.attributes.delete(this.ctx.shopId(), path.attributeId);
  }

  @Put(':attributeId/values')
  replaceAttributeValues(
    @Param(PathIds) path: ReplaceAttributeValuesData['path'],
    @Body({ schema: zReplaceAttributeValuesBody }) body: ReplaceAttributeValuesData['body'],
  ): Promise<Attribute> {
    return this.attributes.replaceValues(this.ctx.shopId(), path.attributeId, body.values);
  }
}
