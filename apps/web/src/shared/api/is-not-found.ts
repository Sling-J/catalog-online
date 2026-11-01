// SDK бросает тело ответа с ошибкой (Problem), а не Error — смотрим на его поле status.
export function isNotFoundError(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'status' in error && error.status === 404;
}
