import { Injectable, type PipeTransform } from '@nestjs/common';

import { AppError } from '../errors/index.js';
import { UUID } from './cursor.js';

/**
 * Id в адресе (`/products/{productId}`): не UUID — 404, как и несуществующий; иначе база упала бы на приведении
 * типа. `@Param(PathIds) path: GetProductData['path']`.
 */
@Injectable()
export class PathIds implements PipeTransform {
  transform(value: unknown): unknown {
    if (typeof value !== 'object' || value === null) return value;
    for (const id of Object.values(value)) {
      if (typeof id !== 'string' || !UUID.test(id)) throw new AppError('not_found', 404);
    }
    return value;
  }
}
