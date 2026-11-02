// SDK бросает тело ответа с ошибкой (Problem), а не Error — смотрим на его поля.
type ProblemLike = { status?: unknown; code?: unknown; errors?: unknown };

const asProblem = (error: unknown): ProblemLike | undefined =>
  typeof error === 'object' && error !== null ? (error as ProblemLike) : undefined;

/** HTTP-статус ошибки API или `undefined` (нет связи, ошибка не от API). */
export const statusOf = (error: unknown): number | undefined => {
  const status = asProblem(error)?.status;
  return typeof status === 'number' ? status : undefined;
};

/** Машинный код ошибки API (`email_taken`, `validation_failed`…). */
export const problemCode = (error: unknown): string | undefined => {
  const code = asProblem(error)?.code;
  return typeof code === 'string' ? code : undefined;
};

/** Коды ошибок по полям для `validation_failed`: `{ password: 'too_short' }`. */
export const fieldErrors = (error: unknown): Record<string, string> => {
  const errors = asProblem(error)?.errors;
  if (!Array.isArray(errors)) return {};
  return Object.fromEntries(
    errors
      .filter(
        (item): item is { field: string; code: string } =>
          typeof item?.field === 'string' && typeof item?.code === 'string',
      )
      .map((item) => [item.field, item.code]),
  );
};

export const isUnauthorized = (error: unknown): boolean => statusOf(error) === 401;
