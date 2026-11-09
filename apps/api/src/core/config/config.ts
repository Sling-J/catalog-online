import { z } from 'zod';

/** Список через запятую: `a, b,c` → ['a', 'b', 'c']. */
const csv = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

/**
 * Переменные окружения API (backend-structure.md, раздел 10). Каждая новая — сюда,
 * в `.env.example` и в README.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
  /** Адреса фронтов для CORS; `*` — любой поддомен: `http://*.localhost:3000`. */
  CORS_ORIGINS: csv.pipe(z.array(z.string().min(1)).min(1)),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  /** Сколько прокси перед API (Caddy — 1): от этого зависит IP клиента для ограничения частоты. */
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),
});

export type Config = {
  env: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  corsOrigins: string[];
  logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
  trustProxy: number;
};

/** Читает и проверяет окружение; при ошибке — исключение со списком переменных. */
export function parseConfig(env: Record<string, string | undefined>): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const lines = result.error.issues.map((issue) => `  ${issue.path.join('.')}: ${issue.message}`);
    throw new Error(`Неверные переменные окружения (см. .env.example):\n${lines.join('\n')}`);
  }
  const e = result.data;
  return {
    env: e.NODE_ENV,
    port: e.API_PORT,
    databaseUrl: e.DATABASE_URL,
    corsOrigins: e.CORS_ORIGINS,
    logLevel: e.LOG_LEVEL,
    trustProxy: e.TRUST_PROXY,
  };
}

/** Единственное место, где API читает `process.env` (правило ESLint). */
export function loadConfig(): Config {
  return parseConfig(process.env);
}
