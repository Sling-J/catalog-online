import * as contract from '@catalog/contract/zod';
import { Injectable, type CallHandler, type ExecutionContext, type NestInterceptor } from '@nestjs/common';
import { map, type Observable } from 'rxjs';
import type { ZodType } from 'zod';

/**
 * Сверка ответов со схемами контракта — в разработке и тестах, не в продакшене (ADR 0001, backend-structure.md,
 * раздел 5). Схема ищется по имени метода контроллера: он совпадает с `operationId` (`implements
 * …ControllerMethods`), `listProducts` → `zListProductsResponse`. Ответ проверяется таким, каким его получит клиент
 * (после JSON), лишние поля — тоже ошибка: в ответ не должно утечь то, чего нет в контракте. Расхождение — 500
 * с подробностями в логе, поэтому e2e-тесты падают на любом несоответствии.
 */
@Injectable()
export class ResponseCheckInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const operation = context.getHandler().name;
    const schema = (contract as Record<string, unknown>)[
      `z${operation[0]!.toUpperCase()}${operation.slice(1)}Response`
    ];
    if (!schema) return next.handle();
    return next.handle().pipe(map((body: unknown) => checkResponse(operation, schema as ZodType, body)));
  }
}

export function checkResponse(operation: string, schema: ZodType, body: unknown): unknown {
  const sent: unknown = body === undefined ? undefined : JSON.parse(JSON.stringify(body));
  const result = schema.safeParse(sent);
  if (!result.success) {
    throw new Error(`Ответ ${operation} не по контракту: ${JSON.stringify(result.error.issues)}`);
  }
  const extra = extraKeys(sent, result.data);
  if (extra.length) throw new Error(`Ответ ${operation}: полей нет в контракте — ${extra.join(', ')}`);
  return body;
}

/** Поля исходного значения, которые схема отбросила (Zod по умолчанию молча убирает неизвестные ключи). */
function extraKeys(sent: unknown, parsed: unknown, path = ''): string[] {
  if (Array.isArray(sent) && Array.isArray(parsed)) {
    return sent.flatMap((item, i) => extraKeys(item, parsed[i], `${path}${i}.`));
  }
  if (!isObject(sent) || !isObject(parsed)) return [];
  return Object.keys(sent).flatMap((key) =>
    key in parsed ? extraKeys(sent[key], parsed[key], `${path}${key}.`) : [`${path}${key}`],
  );
}

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
