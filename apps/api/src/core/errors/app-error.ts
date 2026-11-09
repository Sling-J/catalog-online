/** Ошибка по полю в `Problem.errors[]` (API4). */
export type FieldError = {
  /** Путь: `variants.2.price`. */
  field: string;
  /** `required`, `too_long`, `invalid_format`, `out_of_range`… */
  code: string;
  params?: Record<string, unknown>;
};

/**
 * Машинные коды из контракта (`Problem.code` в openapi.yaml). Новый код — сначала в контракт.
 * Тексты для людей не пишем: их показывает фронт по коду.
 */
export type ProblemCode =
  | 'bad_request'
  | 'forbidden'
  | 'internal_error'
  | 'not_found'
  | 'unauthorized'
  | 'validation_failed'
  | 'rate_limited'
  | 'subdomain_taken'
  | 'subdomain_reserved'
  | 'email_taken'
  | 'sku_taken'
  | 'category_name_taken'
  | 'category_has_children'
  | 'attribute_name_taken'
  | 'attribute_value_in_use'
  | 'attribute_value_taken'
  | 'shop_not_ready'
  | 'shop_hidden'
  | 'shop_blocked'
  | 'import_in_progress'
  | 'import_not_ready'
  | 'photo_limit_reached'
  | 'upload_not_found'
  | 'token_expired';

export type AppErrorOptions = {
  /** Пояснение для разработчика (не для покупателя и не для владельца магазина). */
  detail?: string;
  errors?: FieldError[];
  /** Дополнительные поля тела ответа, например `shop` у 410 витрины. */
  extra?: Record<string, unknown>;
};

/**
 * Ожидаемая ошибка с кодом из контракта. Бросается в сервисах (backend-structure.md, раздел 7),
 * глобальный фильтр превращает её в `application/problem+json`.
 */
export class AppError extends Error {
  constructor(
    readonly code: ProblemCode,
    readonly status: number,
    readonly options: AppErrorOptions = {},
  ) {
    super(options.detail ?? code);
    this.name = 'AppError';
  }
}
