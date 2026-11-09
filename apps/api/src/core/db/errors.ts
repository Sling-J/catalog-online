/** Код ошибки PostgreSQL из исключения Drizzle (сама ошибка драйвера лежит в `cause`). */
export function pgErrorCode(error: unknown): string | undefined {
  const cause = (error as { cause?: { code?: unknown } } | null)?.cause;
  const code = cause?.code ?? (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' ? code : undefined;
}

/** Нарушена уникальность (`23505`): адрес витрины занят, почта занята, артикул повторяется… */
export function isUniqueViolation(error: unknown): boolean {
  return pgErrorCode(error) === '23505';
}
