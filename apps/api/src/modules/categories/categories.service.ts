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

  /**
   * Категории по путям из файла импорта (`['Девочки', 'Куртки']`, не больше двух уровней): находит без учёта
   * регистра, недостающие создаёт в конце своего уровня (FR-A3). Возвращает id по `categoryPathKey(путь)`.
   * Внутри транзакции импорта.
   */
  async ensurePaths(shopId: string, paths: string[][], tx: DbOrTx): Promise<Map<string, string>> {
    await categoriesRepository.lock(tx, shopId);
    const all = await categoriesRepository.list(tx, shopId);
    const siblingKey = (parentId: string | null, name: string) => `${parentId ?? ''}/${name.toLowerCase()}`;
    const known = new Map(all.map((row) => [siblingKey(row.parentId, row.name), row]));
    const nextPosition = new Map<string | null, number>();
    for (const row of all) {
      nextPosition.set(row.parentId, Math.max(nextPosition.get(row.parentId) ?? 0, row.position + 1));
    }
    const ensure = async (name: string, parent: CategoryRow | null): Promise<CategoryRow> => {
      const parentId = parent?.id ?? null;
      const found = known.get(siblingKey(parentId, name));
      if (found) return found;
      const position = nextPosition.get(parentId) ?? 0;
      nextPosition.set(parentId, position + 1);
      const created = await categoriesRepository.insert(tx, shopId, {
        name,
        parentId,
        path: categoryPath(name, parent?.name ?? null),
        position,
      });
      known.set(siblingKey(parentId, name), created);
      return created;
    };
    const ids = new Map<string, string>();
    for (const path of paths) {
      const key = categoryPathKey(path);
      const [rootName, childName] = path;
      if (ids.has(key) || rootName === undefined) continue;
      const root = await ensure(rootName, null);
      ids.set(key, childName === undefined ? root.id : (await ensure(childName, root)).id);
    }
    return ids;
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

/** Ключ пути категории из файла импорта — без учёта регистра. */
export const categoryPathKey = (path: string[]): string => path.map((name) => name.toLowerCase()).join(' / ');

function requireName(value: string): string {
  const name = value.trim();
  if (!name) throw fieldError('name', 'required');
  return name;
}

const fieldError = (field: string, code: string) =>
  new AppError('validation_failed', 422, { errors: [{ field, code }] });
