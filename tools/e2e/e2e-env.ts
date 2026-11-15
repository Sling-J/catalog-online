// Окружение e2e (T-502, решение основателя 2026-11-14): своя база `catalog_e2e` в PostgreSQL из docker compose,
// API, админка и витрина на своих портах — данные разработки не трогаются, каждый прогон с чистой базы.
// Хранилища — те же, что в разработке: анонимное чтение настроено на `catalog-public` (infra/dev/seaweedfs-s3.json),
// а ключи файлов лежат под id магазина.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export const ROOT = resolve(import.meta.dirname, '../..');

/** Корневой `.env` разработки: оттуда подключение к PostgreSQL и S3. */
function readRootEnv(): Record<string, string> {
  const file = resolve(ROOT, '.env');
  const source = existsSync(file) ? readFileSync(file, 'utf8') : readFileSync(resolve(ROOT, '.env.example'), 'utf8');
  const env: Record<string, string> = {};
  for (const line of source.split(/\r?\n/)) {
    const match = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*(#.*)?$/.exec(line);
    if (match) env[match[1]!] = match[2]!;
  }
  return env;
}

const dev = readRootEnv();

export const PORTS = { web: 3100, api: 3101, admin: 3102, staff: 3103 } as const;

export const API_URL = `http://localhost:${PORTS.api}`;
export const ADMIN_URL = `http://app.localhost:${PORTS.admin}`;
/** Суперадминка (ADR 0005). */
export const STAFF_URL = `http://staff.localhost:${PORTS.staff}`;
export const LANDING_URL = `http://localhost:${PORTS.web}`;
/** Витрина магазина: `<поддомен>.localhost:3100`. */
export const shopUrl = (subdomain: string, path = '/'): string => `http://${subdomain}.localhost:${PORTS.web}${path}`;

const devDatabaseUrl = dev.DATABASE_URL ?? 'postgres://catalog:catalog@localhost:5432/catalog';
/** База e2e — рядом с базой разработки, на том же сервере. */
export const DATABASE_URL = devDatabaseUrl.replace(/\/[^/?]+(\?|$)/, '/catalog_e2e$1');
/** Служебная база того же сервера — чтобы пересоздать `catalog_e2e`. */
export const ADMIN_DATABASE_URL = devDatabaseUrl.replace(/\/[^/?]+(\?|$)/, '/postgres$1');

/** Папка писем API (`MAIL_OUTBOX_DIR`): e2e читает из неё ссылки. */
export const MAIL_DIR = resolve(import.meta.dirname, '.mail');

/** Переменные API для e2e. */
export const apiEnv: Record<string, string> = {
  NODE_ENV: 'development',
  API_PORT: String(PORTS.api),
  DATABASE_URL,
  CORS_ORIGINS: `${ADMIN_URL},${LANDING_URL},http://*.localhost:${PORTS.web}`,
  LOG_LEVEL: 'warn',
  ADMIN_URL,
  APP_SECRET: 'e2e-secret-e2e-secret-e2e-secret-0000',
  MAIL_OUTBOX_DIR: MAIL_DIR,
  RATE_LIMITS: 'off',
  S3_ENDPOINT: dev.S3_ENDPOINT ?? 'http://localhost:8333',
  S3_REGION: dev.S3_REGION ?? 'us-east-1',
  S3_ACCESS_KEY: dev.S3_ACCESS_KEY ?? 'catalog-dev',
  S3_SECRET_KEY: dev.S3_SECRET_KEY ?? 'catalog-dev-secret',
  S3_PUBLIC_BUCKET: dev.S3_PUBLIC_BUCKET ?? 'catalog-public',
  S3_PRIVATE_BUCKET: dev.S3_PRIVATE_BUCKET ?? 'catalog-private',
  S3_PUBLIC_URL: dev.S3_PUBLIC_URL ?? 'http://localhost:8333/catalog-public',
};

/**
 * Адреса, которым закрытое хранилище разрешает загрузку из браузера (CORS). Хранилище общее с разработкой, поэтому
 * подготовка e2e пишет адреса обоих окружений — иначе загрузки в разработке перестали бы работать.
 */
export const storageCorsOrigins = [
  ...new Set([...(dev.CORS_ORIGINS ?? '').split(','), dev.ADMIN_URL ?? '', ...apiEnv.CORS_ORIGINS!.split(',')]),
]
  .map((origin) => origin.trim())
  .filter(Boolean)
  .join(',');

/** Админка: запросы на свой адрес, Vite пересылает `/v1` на API e2e. */
export const adminEnv: Record<string, string> = {
  API_PROXY_TARGET: API_URL,
  VITE_STOREFRONT_PORT: String(PORTS.web),
};

/** Суперадминка: как админка — запросы на свой адрес, Vite пересылает `/v1` на API e2e. */
export const staffEnv: Record<string, string> = {
  API_PROXY_TARGET: API_URL,
};

/** Витрина и лендинг: API e2e напрямую. */
export const webEnv: Record<string, string> = {
  VITE_API_URL: API_URL,
  VITE_ADMIN_ORIGIN: ADMIN_URL,
};

/** Демо-данные сида API (`apps/api/src/core/db/seed`). */
export const DEMO = {
  subdomain: 'aigerim-kids',
  hiddenSubdomain: 'skrytyj-magazin',
  email: 'aigerim.kids@example.com',
  password: 'demo-password',
} as const;

/** Сотрудник суперадминки из сида (`DEV_STAFF` в `apps/api/src/core/db/seed/seed.ts`). */
export const STAFF = { email: 'staff@example.com', password: 'staff-password' } as const;
