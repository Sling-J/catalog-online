import type { Category } from '@catalog/contract';

/** Ключ группы верхнего уровня; у подкатегорий группа — id родителя. */
export const ROOT_GROUP = 'root';

/** Порядок категорий по группам: верхний уровень и подкатегории каждого родителя (для перетаскивания). */
export type CategoryGroups = Record<string, string[]>;

export type CategoryOrderItem = { id: string; parentId: string | null; position: number };

const sorted = (list: Category[]) => [...list].sort((a, b) => a.position - b.position);

export function categoryGroups(tree: Category[]): CategoryGroups {
  const top = sorted(tree);
  return {
    [ROOT_GROUP]: top.map((category) => category.id),
    ...Object.fromEntries(top.map((category) => [category.id, sorted(category.children).map((child) => child.id)])),
  };
}

/** Тело `PUT /categories/order` из групп. */
export function orderFromGroups(groups: CategoryGroups): CategoryOrderItem[] {
  return Object.entries(groups).flatMap(([group, ids]) =>
    ids.map((id, position) => ({ id, parentId: group === ROOT_GROUP ? null : group, position })),
  );
}

/** Дерево в порядке групп — показать новый порядок сразу, не дожидаясь ответа. */
export function treeFromGroups(tree: Category[], groups: CategoryGroups): Category[] {
  const byId = new Map(tree.flatMap((category) => [category, ...category.children]).map((item) => [item.id, item]));
  return (groups[ROOT_GROUP] ?? []).flatMap((id, position) => {
    const category = byId.get(id);
    if (!category) return [];
    const children = (groups[id] ?? []).flatMap((childId, index) => {
      const child = byId.get(childId);
      return child ? [{ ...child, parentId: id, position: index, children: [] }] : [];
    });
    return [{ ...category, parentId: null, position, children }];
  });
}

/** Перенести категорию к другому родителю (`null` — на верхний уровень): встаёт в конец его списка. */
export function moveToParent(tree: Category[], id: string, parentId: string | null): CategoryGroups {
  const groups = categoryGroups(tree);
  const target = parentId ?? ROOT_GROUP;
  const next = Object.fromEntries(
    Object.entries(groups).map(([group, ids]) => [group, ids.filter((item) => item !== id)]),
  );
  next[target] = [...(next[target] ?? []), id];
  // ставшая подкатегорией — больше не группа
  if (parentId !== null) delete next[id];
  else next[id] ??= [];
  return next;
}

/** Одинаковые ли группы: перетащили и вернули на место — сохранять нечего. */
export const sameGroups = (a: CategoryGroups, b: CategoryGroups): boolean =>
  JSON.stringify(orderFromGroups(a)) === JSON.stringify(orderFromGroups(b));
