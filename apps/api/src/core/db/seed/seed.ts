import { randomBytes } from 'node:crypto';

import { DEMO_ADMIN_PASSWORD, DEMO_SHOP_ID } from '@catalog/contract/fixtures';
import argon2 from 'argon2';
import { eq, inArray, sql } from 'drizzle-orm';

import * as schema from '../schema/index.js';
import type { Db, Tx } from '../types.js';
import { buildDemoRows, type DemoRows, HIDDEN_SHOP_ID } from './demo-shop.js';
import { forLanding } from './landing-demo.js';

/** Сотрудник суперадминки для разработки (на продакшене — `staff:create`). */
export const DEV_STAFF = { email: 'staff@example.com', password: 'staff-password' } as const;

/**
 * Записывает демо-магазины одной транзакцией. Повторный запуск пересоздаёт их начисто: магазины удаляются, а всё
 * их содержимое уходит каскадом. Другие магазины базы не трогает. Возвращает ключи фото в публичном хранилище —
 * файлы туда кладёт `run.ts`.
 */
export async function seedDemo(db: Db, now = Date.now()): Promise<string[]> {
  const rows = buildDemoRows(await argon2.hash(DEMO_ADMIN_PASSWORD), now);
  const staffHash = await argon2.hash(DEV_STAFF.password);
  await db.transaction(async (tx) => {
    await tx.delete(schema.shops).where(inArray(schema.shops.id, [DEMO_SHOP_ID, HIDDEN_SHOP_ID]));
    await insertDemoRows(tx, rows);
    // сотрудника не удаляем: на него ссылается журнал действий
    const byEmail = eq(sql`lower(${schema.staffUsers.email})`, DEV_STAFF.email);
    const [staff] = await tx.select({ id: schema.staffUsers.id }).from(schema.staffUsers).where(byEmail);
    if (staff) await tx.update(schema.staffUsers).set({ passwordHash: staffHash }).where(byEmail);
    else await tx.insert(schema.staffUsers).values({ email: DEV_STAFF.email, passwordHash: staffHash });
  });
  return photoKeys(rows);
}

/**
 * Демо-магазин для лендинга на продакшене (`demo:publish`, `04-design/storefront.md`, S13): только `aigerim-kids`,
 * опубликован, со своими товарами и фото. Владельцу — случайный пароль, который нигде не печатается: войти нельзя,
 * править — входом «от имени» из суперадминки. Без скрытого магазина, сотрудника суперадминки и выдуманной статистики:
 * просмотры демо копятся настоящие. Повторный запуск возвращает демо к исходному (и обнуляет его статистику).
 * Возвращает ключи фото в публичном хранилище — файлы туда кладёт `demo-publish.run.ts`.
 */
export async function publishDemo(db: Db, now = Date.now()): Promise<string[]> {
  const all = buildDemoRows(await argon2.hash(randomBytes(32).toString('base64url')), now);
  // демо для лендинга: фото у всех видимых товаров (storefront.md S12)
  const rows: DemoRows = forLanding({
    ...all,
    shops: all.shops.filter((shop) => shop.id === DEMO_SHOP_ID),
    accounts: all.accounts.filter((account) => account.shopId === DEMO_SHOP_ID),
    dailyStats: [],
  });
  await db.transaction(async (tx) => {
    await tx.delete(schema.shops).where(eq(schema.shops.id, DEMO_SHOP_ID));
    await insertDemoRows(tx, rows);
  });
  return photoKeys(rows);
}

/** Строки демо-данных — в базу: порядок вставки по внешним ключам. */
async function insertDemoRows(tx: Tx, rows: DemoRows): Promise<void> {
  await tx.insert(schema.shops).values(rows.shops);
  await tx.insert(schema.accounts).values(rows.accounts);
  // сначала корневые категории, потом вложенные — внешний ключ на родителя
  const roots = rows.categories.filter((category) => !category.parentId);
  const children = rows.categories.filter((category) => category.parentId);
  if (roots.length) await tx.insert(schema.categories).values(roots);
  if (children.length) await tx.insert(schema.categories).values(children);
  await tx.insert(schema.attributes).values(rows.attributes);
  await tx.insert(schema.attributeValues).values(rows.attributeValues);
  await tx.insert(schema.products).values(rows.products);
  await tx.insert(schema.variants).values(rows.variants);
  await tx.insert(schema.variantValues).values(rows.variantValues);
  await tx.insert(schema.productPhotos).values(rows.productPhotos);
  if (rows.dailyStats.length) await tx.insert(schema.dailyStats).values(rows.dailyStats);
}

const photoKeys = (rows: DemoRows): string[] => [
  ...new Set(rows.productPhotos.flatMap((photo) => Object.values(photo.sizes ?? {}))),
];
