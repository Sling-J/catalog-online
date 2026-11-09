import type { Category, CreateCategoryData, ReorderCategoriesData } from '@catalog/contract';
import { Injectable } from '@nestjs/common';

import { InjectDb, isUniqueViolation, type Db, type DbOrTx } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { categoriesRepository, type CategoryRow } from './categories.repository.js';
import { buildTree, categoryPath, normalizeOrder, orderErrors } from './lib/tree.js';

/**
 * Категории магазина (FR-A6): дерево до 2 уровней, имя уникально среди соседей без учёта регистра, удаление
 * оставляет товары без категории (внешний ключ `set null`), категорию с подкатегориями удалить нельзя (A28).
 */
@Injectable()
export class CategoriesService {
  constructor(@InjectDb() private readonly db: Db) {}

  async tree(shopId: string, db: DbOrTx = this.db): Promise<Category[]> {
    return buildTree(await categoriesRepository.listWithCounts(db, shopId));
  }

  /** Есть ли категория у магазина — для товаров (выбор категории, массовая смена). */
  async exists(shopId: string, categoryId: string, tx?: DbOrTx): Promise<boolean> {
    return (await categoriesRepository.find(tx ?? this.db, shopId, categoryId)) !== null;
  }

  async create(shopId: string, body: CreateCategoryData['body']): Promise<Category> {
    const name = requireName(body.name);
    const parentId = body.parentId ?? null;
    const id = await this.writing(() =>
      this.db.transaction(async (tx) => {
        await categoriesRepository.lock(tx, shopId);
        let parentName: string | null = null;
        if (parentId) {
          const parent = await categoriesRepository.find(tx, shopId, parentId);
          if (!parent) throw fieldError('parentId', 'not_found');
          // не больше 2 уровней: внутрь подкатегории нельзя
          if (parent.parentId !== null) throw fieldError('parentId', 'too_deep');
          parentName = parent.name;
        }
        const position = await categoriesRepository.countSiblings(tx, shopId, parentId);
        const created = await categoriesRepository.insert(tx, shopId, {
          name,
          parentId,
          path: categoryPath(name, parentName),
          position,
        });
        return created.id;
      }),
    );
    return this.findInTree(shopId, id);
  }

  async rename(shopId: string, categoryId: string, value: string): Promise<Category> {
    const name = requireName(value);
    await this.writing(() =>
      this.db.transaction(async (tx) => {
        await categoriesRepository.lock(tx, shopId);
        const all = await categoriesRepository.list(tx, shopId);
        const category = all.find((row) => row.id === categoryId);
        if (!category) throw new AppError('not_found', 404);
        const parent = all.find((row) => row.id === category.parentId) ?? null;
        await categoriesRepository.update(tx, shopId, categoryId, {
          name,
          path: categoryPath(name, parent?.name ?? null),
        });
        // путь подкатегорий содержит имя родителя
        for (const child of all.filter((row) => row.parentId === categoryId)) {
          await categoriesRepository.update(tx, shopId, child.id, { path: categoryPath(child.name, name) });
        }
      }),
    );
    return this.findInTree(shopId, categoryId);
  }

  /** Порядок и вложенность целиком после перетаскивания (ровно все категории магазина), одной транзакцией. */
  async reorder(shopId: string, items: ReorderCategoriesData['body']['items']): Promise<Category[]> {
    return this.db.transaction(async (tx) => {
      await categoriesRepository.lock(tx, shopId);
      const current = await categoriesRepository.list(tx, shopId);
      const errors = orderErrors(current, items);
      if (errors.length) throw new AppError('validation_failed', 422, { errors });

      const byId = new Map(current.map((row) => [row.id, row]));
      const order = normalizeOrder(items);
      const parentOf = new Map(order.map((item) => [item.id, item.parentId]));
      const moved = order.filter((item) => byId.get(item.id)!.parentId !== item.parentId).map((item) => item.id);
      await categoriesRepository.parkParents(tx, shopId, moved);
      const parked = new Set(moved);
      for (const item of order) {
        const row = byId.get(item.id)!;
        const parentName = item.parentId ? byId.get(item.parentId)!.name : null;
        const path = categoryPath(row.name, parentName);
        if (!parked.has(item.id) && row.position === item.position && row.path === path) continue;
        await categoriesRepository.update(tx, shopId, item.id, {
          parentId: parentOf.get(item.id)!,
          position: item.position,
          path,
        });
      }
      return this.tree(shopId, tx);
    });
  }

  async delete(shopId: string, categoryId: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      await categoriesRepository.lock(tx, shopId);
      const category = await categoriesRepository.find(tx, shopId, categoryId);
      if (!category) throw new AppError('not_found', 404);
      if (await categoriesRepository.hasChildren(tx, shopId, categoryId)) {
        throw new AppError('category_has_children', 409);
      }
      await categoriesRepository.delete(tx, shopId, categoryId);
      await this.renumberSiblings(tx, shopId, category);
    });
  }

  /** После удаления соседи сдвигаются: позиции снова подряд. */
  private async renumberSiblings(tx: DbOrTx, shopId: string, removed: CategoryRow): Promise<void> {
    const siblings = (await categoriesRepository.list(tx, shopId))
      .filter((row) => row.parentId === removed.parentId)
      .sort((a, b) => a.position - b.position);
    for (const [position, row] of siblings.entries()) {
      if (row.position !== position) await categoriesRepository.update(tx, shopId, row.id, { position });
    }
  }

  private async findInTree(shopId: string, categoryId: string): Promise<Category> {
    const flat = (await this.tree(shopId)).flatMap((category) => [category, ...category.children]);
    return flat.find((category) => category.id === categoryId)!;
  }

  /** Повтор имени среди соседей (в том числе параллельный) — 409 `category_name_taken`. */
  private async writing<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run();
    } catch (error) {
      if (isUniqueViolation(error)) throw new AppError('category_name_taken', 409);
      throw error;
    }
  }
}

function requireName(value: string): string {
  const name = value.trim();
  if (!name) throw fieldError('name', 'required');
  return name;
}

const fieldError = (field: string, code: string) =>
  new AppError('validation_failed', 422, { errors: [{ field, code }] });
