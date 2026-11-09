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
  /** Адрес админки — для ссылок в письмах (api.md, «Ссылки из писем»). */
  ADMIN_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, '')),
  /** Общий домен админки и API для cookie сессии (`.example.kz`); пусто — cookie только для адреса API. */
  COOKIE_DOMAIN: z.string().min(1).optional(),
  /** SMTP для писем (`smtp://user:pass@host:587`); пусто — письма пишутся в лог (разработка). */
  SMTP_URL: z.url({ protocol: /^smtps?$/ }).optional(),
  MAIL_FROM: z.string().min(3).default('Каталог <no-reply@localhost>'),
  /** Секрет для подписи токенов (превью витрины); не короче 32 символов, в продакшене — свой. */
  APP_SECRET: z.string().min(32),
  /** S3-совместимое хранилище (в разработке — SeaweedFS из docker-compose.yml). */
  S3_ENDPOINT: z.url({ protocol: /^https?$/ }),
  S3_REGION: z.string().min(1).default('us-east-1'),
  S3_ACCESS_KEY: z.string().min(1),
  S3_SECRET_KEY: z.string().min(1),
  /** Публичное: готовые фото и логотипы, их открывает кто угодно (решение основателя 2026-11-09, T-405). */
  S3_PUBLIC_BUCKET: z.string().min(3),
  /** Закрытое: исходники фото и файлы импорта — только для API. */
  S3_PRIVATE_BUCKET: z.string().min(3),
  /** Адрес, по которому покупатель открывает файлы публичного хранилища (без `/` в конце); позже — CDN. */
  S3_PUBLIC_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, '')),
});

export type Config = {
  env: 'development' | 'test' | 'production';
  port: number;
  databaseUrl: string;
  corsOrigins: string[];
  logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
  trustProxy: number;
  adminUrl: string;
  cookieDomain: string | undefined;
  smtpUrl: string | undefined;
  mailFrom: string;
  appSecret: string;
  s3: {
    endpoint: string;
    region: string;
    accessKey: string;
    secretKey: string;
    publicBucket: string;
    privateBucket: string;
    publicUrl: string;
  };
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
    adminUrl: e.ADMIN_URL,
    cookieDomain: e.COOKIE_DOMAIN,
    smtpUrl: e.SMTP_URL,
    mailFrom: e.MAIL_FROM,
    appSecret: e.APP_SECRET,
    s3: {
      endpoint: e.S3_ENDPOINT,
      region: e.S3_REGION,
      accessKey: e.S3_ACCESS_KEY,
      secretKey: e.S3_SECRET_KEY,
      publicBucket: e.S3_PUBLIC_BUCKET,
      privateBucket: e.S3_PRIVATE_BUCKET,
      publicUrl: e.S3_PUBLIC_URL,
    },
  };
}

/** Единственное место, где API читает `process.env` (правило ESLint). */
export function loadConfig(): Config {
  return parseConfig(process.env);
}
