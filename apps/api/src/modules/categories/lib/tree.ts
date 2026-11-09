import type { Category } from '@catalog/contract';

import type { FieldError } from '../../../core/errors/index.js';

/** Категория из базы с числом её собственных товаров. */
export type CategoryNode = {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  productCount: number;
};

export type OrderItem = { id: string; parentId: string | null; position: number };

const byPosition = (a: { position: number }, b: { position: number }) => a.position - b.position;

/** Плоский список → дерево контракта (2 уровня, по `position`). У родителя — только его собственные товары. */
export function buildTree(nodes: CategoryNode[]): Category[] {
  const build = (parentId: string | null): Category[] =>
    nodes
      .filter((node) => node.parentId === parentId)
      .sort(byPosition)
      .map((node) => ({ ...node, children: parentId === null ? build(node.id) : [] }));
  return build(null);
}

/** `Девочки / Куртки` — по нему импорт находит категорию (data-model.md). */
export const categoryPath = (name: string, parentName: string | null): string =>
  parentName === null ? name : `${parentName} / ${name}`;

const nameKey = (name: string) => name.trim().toLowerCase();

/**
 * Ошибки нового порядка (`PUT /categories/order`): ровно все категории магазина по разу; родитель — существующая
 * категория верхнего уровня (не сама категория); категория с подкатегориями не становится вложенной; у новых
 * соседей имена не повторяются. Как в моках (T-311).
 */
export function orderErrors(current: { id: string; name: string }[], items: OrderItem[]): FieldError[] {
  const names = new Map(current.map((item) => [item.id, item.name]));
  const ids = new Set(items.map((item) => item.id));
  if (items.length !== names.size || ids.size !== names.size || items.some((item) => !names.has(item.id))) {
    return [{ field: 'items', code: 'invalid_value' }];
  }
  const parentOf = new Map(items.map((item) => [item.id, item.parentId]));
  const hasChildren = new Set(items.flatMap((item) => (item.parentId ? [item.parentId] : [])));
  const errors: FieldError[] = [];
  const seen = new Set<string>();
  items.forEach((item, i) => {
    if (item.parentId !== null) {
      const parentOk = item.parentId !== item.id && names.has(item.parentId) && parentOf.get(item.parentId) === null;
      if (!parentOk || hasChildren.has(item.id)) {
        errors.push({ field: `items.${i}.parentId`, code: 'invalid_value' });
        return;
      }
    }
    const key = `${item.parentId ?? ''}/${nameKey(names.get(item.id)!)}`;
    if (seen.has(key)) errors.push({ field: `items.${i}.id`, code: 'duplicate' });
    seen.add(key);
  });
  return errors;
}

/** Позиции внутри каждого родителя подряд с нуля: по присланной позиции, при равенстве — по порядку в запросе. */
export function normalizeOrder(items: OrderItem[]): OrderItem[] {
  const groups = new Map<string | null, OrderItem[]>();
  for (const item of items) groups.set(item.parentId, [...(groups.get(item.parentId) ?? []), item]);
  return [...groups.values()].flatMap((group) =>
    [...group].sort(byPosition).map((item, position) => ({ ...item, position })),
  );
}
