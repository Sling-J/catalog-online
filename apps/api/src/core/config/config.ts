import { z } from 'zod';

/** Список через запятую: `a, b,c` → ['a', 'b', 'c']. */
const csv = z.string().transform((value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean),
);

/** Подсеть для `trust proxy`: имя из Express (`loopback`, `linklocal`, `uniquelocal`) или адрес / CIDR. */
const PROXY = /^(loopback|linklocal|uniquelocal|[\d.]+(\/\d{1,2})?|[\da-f:]+(\/\d{1,3})?)$/i;

/**
 * Переменные окружения API (backend-structure.md, раздел 10). Каждая новая — сюда,
 * в `.env.example` и в README.
 */
const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),
    DATABASE_URL: z.url({ protocol: /^postgres(ql)?$/ }),
    /**
     * Подключений к базе у пула приложения на процесс (у pg-boss — свои: 2 у API, 4 у процесса задач). Сумма по
     * всем процессам должна помещаться в `max_connections` PostgreSQL (по умолчанию 100) — scaling.md, SC12.
     */
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    /** Адреса фронтов для CORS; `*` — любой поддомен: `http://*.localhost:3000`. */
    CORS_ORIGINS: csv.pipe(z.array(z.string().min(1)).min(1)),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    /**
     * Каким прокси верить в `X-Forwarded-For` — от этого зависит IP клиента для ограничения частоты (Express
     * `trust proxy`). Число — сколько прокси перед API; список подсетей через запятую (`loopback, uniquelocal`) —
     * каким адресам верить. В продакшене — список: к API два пути разной длины (Caddy → api и Caddy → web → api,
     * SSR витрины), число на одном из них верит подделанному заголовку (api.md, «Ограничение частоты»).
     */
    TRUST_PROXY: z
      .string()
      .default('0')
      .pipe(z.union([z.string().regex(/^\d+$/).transform(Number), csv.pipe(z.array(z.string().regex(PROXY)).min(1))])),
    /** Адрес админки — для ссылок в письмах (api.md, «Ссылки из писем»). */
    ADMIN_URL: z.url({ protocol: /^https?$/ }).transform((url) => url.replace(/\/+$/, '')),
    /** Общий домен админки и API для cookie сессии (`.example.kz`); пусто — cookie только для адреса API. */
    COOKIE_DOMAIN: z.string().min(1).optional(),
    /** SMTP для писем (`smtp://user:pass@host:587`); пусто — письма пишутся в лог (разработка). */
    SMTP_URL: z.url({ protocol: /^smtps?$/ }).optional(),
    MAIL_FROM: z.string().min(3).default('Каталог <no-reply@localhost>'),
    /** Разработка и e2e: каждое письмо — JSON-файл в этой папке (вместо лога); в продакшене запрещено (T-502). */
    MAIL_OUTBOX_DIR: z.string().min(1).optional(),
    /** `off` — без ограничений частоты: e2e регистрируют и входят чаще лимитов; в продакшене запрещено (T-502). */
    RATE_LIMITS: z.enum(['on', 'off']).default('on'),
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
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV !== 'production') return;
    if (env.MAIL_OUTBOX_DIR)
      ctx.addIssue({ code: 'custom', path: ['MAIL_OUTBOX_DIR'], message: 'только для разработки и тестов' });
    if (env.RATE_LIMITS === 'off')
      ctx.addIssue({ code: 'custom', path: ['RATE_LIMITS'], message: 'в продакшене ограничения частоты обязательны' });
  });

/**
 * Роль процесса в очереди (T-607, scaling.md SC1): API (`main.ts`) задачи только ставит, процесс задач
 * (`worker.ts`) выполняет их и запускает расписания. Задаётся точкой входа, не переменной окружения.
 */
export type JobsRole = 'enqueue' | 'work';

export type Config = {
  env: 'development' | 'test' | 'production';
  jobsRole: JobsRole;
  port: number;
  databaseUrl: string;
  databasePoolMax: number;
  corsOrigins: string[];
  logLevel: z.infer<typeof envSchema>['LOG_LEVEL'];
  /** Число прокси или список доверенных подсетей — как `trust proxy` в Express. */
  trustProxy: number | string[];
  adminUrl: string;
  cookieDomain: string | undefined;
  smtpUrl: string | undefined;
  mailFrom: string;
  mailOutboxDir: string | undefined;
  rateLimits: boolean;
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
    jobsRole: 'enqueue',
    port: e.API_PORT,
    databaseUrl: e.DATABASE_URL,
    databasePoolMax: e.DATABASE_POOL_MAX,
    corsOrigins: e.CORS_ORIGINS,
    logLevel: e.LOG_LEVEL,
    trustProxy: e.TRUST_PROXY,
    adminUrl: e.ADMIN_URL,
    cookieDomain: e.COOKIE_DOMAIN,
    smtpUrl: e.SMTP_URL,
    mailFrom: e.MAIL_FROM,
    mailOutboxDir: e.MAIL_OUTBOX_DIR,
    rateLimits: e.RATE_LIMITS === 'on',
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
