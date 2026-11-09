import type {
  Category,
  CreateCategoryData,
  DeleteCategoryData,
  ListCategoriesResponse,
  RenameCategoryData,
  ReorderCategoriesData,
} from '@catalog/contract';
import type { CategoriesControllerMethods } from '@catalog/contract/nest';
import { zCreateCategoryBody, zRenameCategoryBody, zReorderCategoriesBody } from '@catalog/contract/zod';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put } from '@nestjs/common';

import { Authenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { PathIds } from '../../core/pagination/index.js';
import { CategoriesService } from './categories.service.js';

/** `/v1/admin/categories*` (контракт, тег categories). Магазин — из сессии (API1). */
@Controller('v1/admin/categories')
@Authenticated()
export class CategoriesController implements CategoriesControllerMethods {
  constructor(
    private readonly categories: CategoriesService,
    private readonly ctx: RequestContext,
  ) {}

  @Get()
  listCategories(): Promise<ListCategoriesResponse> {
    return this.categories.tree(this.ctx.shopId());
  }

  @Post()
  createCategory(@Body({ schema: zCreateCategoryBody }) body: CreateCategoryData['body']): Promise<Category> {
    return this.categories.create(this.ctx.shopId(), body);
  }

  @Put('order')
  reorderCategories(
    @Body({ schema: zReorderCategoriesBody }) body: ReorderCategoriesData['body'],
  ): Promise<Category[]> {
    return this.categories.reorder(this.ctx.shopId(), body.items);
  }

  @Patch(':categoryId')
  renameCategory(
    @Param(PathIds) path: RenameCategoryData['path'],
    @Body({ schema: zRenameCategoryBody }) body: RenameCategoryData['body'],
  ): Promise<Category> {
    return this.categories.rename(this.ctx.shopId(), path.categoryId, body.name);
  }

  @Delete(':categoryId')
  @HttpCode(204)
  deleteCategory(@Param(PathIds) path: DeleteCategoryData['path']): Promise<void> {
    return this.categories.delete(this.ctx.shopId(), path.categoryId);
  }
}
