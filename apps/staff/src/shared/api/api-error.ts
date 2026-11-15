// SDK бросает тело ответа с ошибкой (Problem), а не Error — смотрим на его поля.

/** HTTP-статус ошибки API или `undefined` (нет связи, ошибка не от API). */
export const statusOf = (error: unknown): number | undefined => {
  const status = typeof error === 'object' && error !== null ? (error as { status?: unknown }).status : undefined;
  return typeof status === 'number' ? status : undefined;
};

export const isUnauthorized = (error: unknown): boolean => statusOf(error) === 401;
