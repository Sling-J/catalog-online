// Магазин и доступ (data-model.md, «Магазин и доступ»).
import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  smallint,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { at, createdAt, id, updatedAt } from './columns.js';
import { staffUsers } from './staff.js';

export const shopStatus = pgEnum('shop_status', ['draft', 'published', 'blocked']);
export const stockDisplay = pgEnum('stock_display', ['levels', 'exact']);

export type DayHours = { open: string; close: string } | null;
/** 7 дней; `null` — выходной. Время — по часовому поясу магазина. */
export type Schedule = Record<'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun', DayHours>;

export const EMPTY_SCHEDULE: Schedule = { mon: null, tue: null, wed: null, thu: null, fri: null, sat: null, sun: null };

/**
 * Магазин. Название, адрес витрины и WhatsApp пусты сразу после регистрации — их заполняет мастер
 * (контракт `Shop`: эти поля `null`), поэтому в базе они необязательные.
 */
export const shops = pgTable(
  'shops',
  {
    id: id(),
    subdomain: text(),
    name: text(),
    logoKey: text(),
    description: text(),
    whatsapp: text(),
    instagram: text(),
    address: text(),
    howToFind: text(),
    schedule: jsonb().$type<Schedule>().notNull().default(EMPTY_SCHEDULE),
    timezone: text().notNull().default('Asia/Almaty'),
    status: shopStatus().notNull().default('draft'),
    stockDisplay: stockDisplay().notNull().default('levels'),
    lowStockThreshold: smallint().notNull().default(2),
    showOutOfStock: boolean().notNull().default(false),
    /** Мастер первичной настройки пройден (`Me.shop.setupCompleted`). */
    setupCompleted: boolean().notNull().default(false),
    publishedAt: at(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex('shops_subdomain_unique').on(t.subdomain),
    check('shops_low_stock_threshold_range', sql`${t.lowStockThreshold} between 1 and 50`),
  ],
);

/** Логин магазина (D10: один на магазин). Почта хранится в нижнем регистре, уникальность — без учёта регистра. */
export const accounts = pgTable(
  'accounts',
  {
    id: id(),
    shopId: uuid()
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    email: text().notNull(),
    passwordHash: text().notNull(),
    emailVerifiedAt: at(),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex('accounts_shop_unique').on(t.shopId),
    uniqueIndex('accounts_email_unique').on(sql`lower(${t.email})`),
  ],
);

/**
 * Сессии входа (cookie `sid`). `id` — хеш случайного токена из cookie, сам токен в базе не хранится.
 * `impersonatedBy` — вход сотрудника «от имени» магазина (FR-S3).
 */
export const sessions = pgTable(
  'sessions',
  {
    id: text().primaryKey(),
    accountId: uuid()
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    impersonatedBy: uuid().references(() => staffUsers.id, { onDelete: 'cascade' }),
    expiresAt: at().notNull(),
    userAgent: text(),
    ip: text(),
    createdAt: createdAt(),
  },
  (t) => [index('sessions_account_idx').on(t.accountId)],
);

export const authTokenPurpose = pgEnum('auth_token_purpose', ['verify_email', 'reset_password']);

/** Одноразовые ссылки из писем: подтверждение почты, сброс пароля. */
export const authTokens = pgTable(
  'auth_tokens',
  {
    id: id(),
    accountId: uuid()
      .notNull()
      .references(() => accounts.id, { onDelete: 'cascade' }),
    purpose: authTokenPurpose().notNull(),
    tokenHash: text().notNull(),
    expiresAt: at().notNull(),
    usedAt: at(),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex('auth_tokens_hash_unique').on(t.tokenHash), index('auth_tokens_account_idx').on(t.accountId)],
);

export const uploadPurpose = pgEnum('upload_purpose', ['product_photo', 'logo', 'import']);

/**
 * Выданные ссылки на загрузку в хранилище (API2): `createUpload` → файл уходит `PUT` в S3 → `uploadId` передаётся
 * в запрос фото, логотипа или импорта. По записи API проверяет, что файл свой, нужного назначения и ещё не использован.
 */
export const uploads = pgTable(
  'uploads',
  {
    id: id(),
    shopId: uuid()
      .notNull()
      .references(() => shops.id, { onDelete: 'cascade' }),
    purpose: uploadPurpose().notNull(),
    key: text().notNull(),
    fileName: text().notNull(),
    contentType: text().notNull(),
    size: integer().notNull(),
    expiresAt: at().notNull(),
    usedAt: at(),
    createdAt: createdAt(),
  },
  (t) => [index('uploads_shop_idx').on(t.shopId), uniqueIndex('uploads_key_unique').on(t.key)],
);
