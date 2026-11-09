import type {
  AddProductPhotoData,
  BulkUpdateProductsData,
  BulkUpdateProductsResponse,
  CreateProductData,
  DeleteProductData,
  DeleteProductPhotoData,
  GetProductCountsResponse,
  GetProductData,
  ListProductsData,
  ListProductsResponse,
  Photo,
  Product,
  ReorderProductPhotosData,
  ReplaceProductVariantsData,
  UpdateProductData,
} from '@catalog/contract';
import type { ProductsControllerMethods } from '@catalog/contract/nest';
import {
  zAddProductPhotoBody,
  zBulkUpdateProductsBody,
  zCreateProductBody,
  zListProductsQuery,
  zReorderProductPhotosBody,
  zReplaceProductVariantsBody,
  zUpdateProductBody,
} from '@catalog/contract/zod';
import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Put, Query } from '@nestjs/common';

import { Authenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { PathIds } from '../../core/pagination/index.js';
import { ProductPhotosService } from './product-photos.service.js';
import { ProductsService } from './products.service.js';

/** `/v1/admin/products*` (контракт, тег products). Магазин — из сессии (API1). */
@Controller('v1/admin/products')
@Authenticated()
export class ProductsController implements ProductsControllerMethods {
  constructor(
    private readonly products: ProductsService,
    private readonly photos: ProductPhotosService,
    private readonly ctx: RequestContext,
  ) {}

  @Get()
  listProducts(@Query({ schema: zListProductsQuery }) query: ListProductsData['query']): Promise<ListProductsResponse> {
    return this.products.list(this.ctx.shopId(), query ?? {});
  }

  @Post()
  createProduct(@Body({ schema: zCreateProductBody }) body: CreateProductData['body']): Promise<Product> {
    return this.products.create(this.ctx.shopId(), body);
  }

  @Get('counts')
  getProductCounts(): Promise<GetProductCountsResponse> {
    return this.products.counts(this.ctx.shopId());
  }

  @Post('bulk')
  @HttpCode(200)
  bulkUpdateProducts(
    @Body({ schema: zBulkUpdateProductsBody }) body: BulkUpdateProductsData['body'],
  ): Promise<BulkUpdateProductsResponse> {
    return this.products.bulk(this.ctx.shopId(), body);
  }

  @Get(':productId')
  getProduct(@Param(PathIds) path: GetProductData['path']): Promise<Product> {
    return this.products.get(this.ctx.shopId(), path.productId);
  }

  @Patch(':productId')
  updateProduct(
    @Param(PathIds) path: UpdateProductData['path'],
    @Body({ schema: zUpdateProductBody }) body: UpdateProductData['body'],
  ): Promise<Product> {
    return this.products.update(this.ctx.shopId(), path.productId, body);
  }

  @Delete(':productId')
  @HttpCode(204)
  deleteProduct(@Param(PathIds) path: DeleteProductData['path']): Promise<void> {
    return this.products.delete(this.ctx.shopId(), path.productId);
  }

  @Put(':productId/variants')
  replaceProductVariants(
    @Param(PathIds) path: ReplaceProductVariantsData['path'],
    @Body({ schema: zReplaceProductVariantsBody }) body: ReplaceProductVariantsData['body'],
  ): Promise<Product> {
    return this.products.replaceVariants(this.ctx.shopId(), path.productId, body.variants);
  }

  @Post(':productId/photos')
  addProductPhoto(
    @Param(PathIds) path: AddProductPhotoData['path'],
    @Body({ schema: zAddProductPhotoBody }) body: AddProductPhotoData['body'],
  ): Promise<Photo> {
    return this.photos.add(this.ctx.shopId(), path.productId, body.uploadId);
  }

  @Put(':productId/photos/order')
  reorderProductPhotos(
    @Param(PathIds) path: ReorderProductPhotosData['path'],
    @Body({ schema: zReorderProductPhotosBody }) body: ReorderProductPhotosData['body'],
  ): Promise<Photo[]> {
    return this.photos.reorder(this.ctx.shopId(), path.productId, body.photoIds);
  }

  @Delete(':productId/photos/:photoId')
  @HttpCode(204)
  deleteProductPhoto(@Param(PathIds) path: DeleteProductPhotoData['path']): Promise<void> {
    return this.photos.delete(this.ctx.shopId(), path.productId, path.photoId);
  }
}
