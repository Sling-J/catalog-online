import { STATUS_CODES } from 'node:http';

import { Catch, HttpException, Logger, type ArgumentsHost, type ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';

import { AppError, type FieldError, type ProblemCode } from './app-error.js';

type Problem = {
  type: string;
  title: string;
  status: number;
  code: ProblemCode;
  detail?: string;
  errors?: FieldError[];
  [extra: string]: unknown;
};

/** Код по статусу для исключений Nest и Express (не наших `AppError`). */
function codeForStatus(status: number): ProblemCode {
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'internal_error';
  return 'bad_request';
}

/** Ошибки Express-мидлвар (разбор JSON, размер тела) приходят с `status` — это ошибка клиента. */
function clientErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const status =
    (error as { status?: unknown; statusCode?: unknown }).status ?? (error as { statusCode?: unknown }).statusCode;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : undefined;
}

export function toProblem(error: unknown): Problem {
  if (error instanceof AppError) {
    const { detail, errors, extra } = error.options;
    return {
      ...extra,
      type: 'about:blank',
      title: STATUS_CODES[error.status] ?? 'Error',
      status: error.status,
      code: error.code,
      ...(detail ? { detail } : {}),
      ...(errors ? { errors } : {}),
    };
  }
  const status = error instanceof HttpException ? error.getStatus() : (clientErrorStatus(error) ?? 500);
  return {
    type: 'about:blank',
    title: STATUS_CODES[status] ?? 'Error',
    status,
    code: codeForStatus(status),
  };
}

/**
 * Любое исключение → `application/problem+json` (RFC 9457, API4). Неожиданное → 500 `internal_error`
 * без деталей наружу, полный текст — в лог.
 */
@Catch()
export class ProblemFilter implements ExceptionFilter {
  private readonly logger = new Logger('ProblemFilter');

  catch(error: unknown, host: ArgumentsHost): void {
    const problem = toProblem(error);
    if (problem.status >= 500) this.logger.error(error);

    const res = host.switchToHttp().getResponse<Response>();
    if (res.headersSent) return;
    res.status(problem.status).type('application/problem+json').send(JSON.stringify(problem));
  }
}
