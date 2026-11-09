import { Injectable, type ArgumentMetadata, type PipeTransform } from '@nestjs/common';

import { AppError } from '../errors/index.js';
import { coerceQuery } from './coerce-query.js';
import { toFieldErrors } from './field-errors.js';

/**
 * Проверка входных данных схемами Zod из контракта (`@catalog/contract/zod`, backend-structure.md, раздел 5).
 * Схема указывается в декораторе: `@Body({ schema: zLoginBody }) body: LoginData['body']`.
 * Ошибка → 422 `validation_failed` с `errors[]` по полям. Без схемы параметр не проверяется.
 *
 * Своя pipe, а не встроенная `StandardSchemaValidationPipe`: её `exceptionFactory` получает только issues,
 * а чтобы отличить «поля нет» (required) от «не тот тип», нужно исходное значение; ещё — приведение
 * строк адреса к числам.
 */
@Injectable()
export class ValidationPipe implements PipeTransform {
  async transform(value: unknown, metadata: ArgumentMetadata): Promise<unknown> {
    const schema = metadata.schema;
    if (!schema || metadata.type === 'custom') return value;

    const input = metadata.type === 'query' || metadata.type === 'param' ? coerceQuery(schema, value) : value;
    const result = await schema['~standard'].validate(input);
    if (result.issues) {
      throw new AppError('validation_failed', 422, { errors: toFieldErrors(result.issues, input) });
    }
    return result.value;
  }
}
