import type {
  ApplyImportData,
  CancelImportData,
  CreateImportData,
  DownloadImportTemplateResponse,
  GetImportData,
  Import,
  ListImportErrorsData,
  ListImportErrorsResponse,
  ListImportsData,
  ListImportsResponse,
  SetImportMappingData,
} from '@catalog/contract';
import type { ImportsControllerMethods } from '@catalog/contract/nest';
import {
  zApplyImportBody,
  zCreateImportBody,
  zListImportErrorsQuery,
  zListImportsQuery,
  zSetImportMappingBody,
} from '@catalog/contract/zod';
import { Body, Controller, Delete, Get, HttpCode, Param, Post, Put, Query, StreamableFile } from '@nestjs/common';

import { Authenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { PathIds } from '../../core/pagination/index.js';
import { ImportsService } from './imports.service.js';
import { TEMPLATE_FILE_NAME, XLSX_TYPE } from './lib/template.js';

/** `/v1/admin/imports*` (контракт, тег imports). Магазин — из сессии (API1). */
@Controller('v1/admin/imports')
@Authenticated()
export class ImportsController implements ImportsControllerMethods {
  constructor(
    private readonly imports: ImportsService,
    private readonly ctx: RequestContext,
  ) {}

  @Get()
  listImports(@Query({ schema: zListImportsQuery }) query: ListImportsData['query']): Promise<ListImportsResponse> {
    return this.imports.list(this.ctx.shopId(), query ?? {});
  }

  /**
   * Своего ограничения частоты нет: каждому импорту нужна новая загрузка (их не больше 120 в минуту), а
   * незаконченный импорт у магазина один.
   */
  @Post()
  @HttpCode(202)
  createImport(@Body({ schema: zCreateImportBody }) body: CreateImportData['body']): Promise<Import> {
    return this.imports.create(this.ctx.shopId(), body.uploadId);
  }

  // до `:importId`: иначе «template» сойдёт за id
  @Get('template')
  async downloadImportTemplate(): Promise<DownloadImportTemplateResponse> {
    const file = new StreamableFile(await this.imports.downloadTemplate(), {
      type: XLSX_TYPE,
      disposition: `attachment; filename="${TEMPLATE_FILE_NAME}"`,
    });
    // в контракте ответ — двоичный файл; Nest отдаёт его потоком
    return file as unknown as DownloadImportTemplateResponse;
  }

  @Get(':importId')
  getImport(@Param(PathIds) path: GetImportData['path']): Promise<Import> {
    return this.imports.get(this.ctx.shopId(), path.importId);
  }

  @Delete(':importId')
  @HttpCode(204)
  cancelImport(@Param(PathIds) path: CancelImportData['path']): Promise<void> {
    return this.imports.cancel(this.ctx.shopId(), path.importId);
  }

  @Put(':importId/mapping')
  @HttpCode(202)
  setImportMapping(
    @Param(PathIds) path: SetImportMappingData['path'],
    @Body({ schema: zSetImportMappingBody }) body: SetImportMappingData['body'],
  ): Promise<Import> {
    return this.imports.setMapping(this.ctx.shopId(), path.importId, body.mapping);
  }

  @Get(':importId/errors')
  listImportErrors(
    @Param(PathIds) path: ListImportErrorsData['path'],
    @Query({ schema: zListImportErrorsQuery }) query: ListImportErrorsData['query'],
  ): Promise<ListImportErrorsResponse> {
    return this.imports.errors(this.ctx.shopId(), path.importId, query ?? {});
  }

  @Post(':importId/apply')
  @HttpCode(202)
  applyImport(
    @Param(PathIds) path: ApplyImportData['path'],
    @Body({ schema: zApplyImportBody }) body: ApplyImportData['body'],
  ): Promise<Import> {
    return this.imports.apply(this.ctx.shopId(), path.importId, body.zeroMissing);
  }
}
