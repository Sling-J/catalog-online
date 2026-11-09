import { DEMO_ADMIN_PASSWORD, DEMO_SHOP_ID } from '@catalog/contract/fixtures';
import argon2 from 'argon2';
import { inArray } from 'drizzle-orm';

import * as schema from '../schema/index.js';
import type { Db } from '../types.js';
import { buildDemoRows, HIDDEN_SHOP_ID } from './demo-shop.js';

/**
 * Записывает демо-магазины одной транзакцией. Повторный запуск пересоздаёт их начисто: магазины удаляются, а всё
 * их содержимое уходит каскадом. Другие магазины базы не трогает.
 */
export async function seedDemo(db: Db, now = Date.now()): Promise<void> {
  const rows = buildDemoRows(await argon2.hash(DEMO_ADMIN_PASSWORD), now);
  await db.transaction(async (tx) => {
    await tx.delete(schema.shops).where(inArray(schema.shops.id, [DEMO_SHOP_ID, HIDDEN_SHOP_ID]));
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
    await tx.insert(schema.dailyStats).values(rows.dailyStats);
  });
}
