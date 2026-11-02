import type { Category } from '@catalog/contract';

export type CategoryOption = { id: string; name: string; depth: number };

/** Дерево категорий (до 2 уровней, FR-A6) — плоским списком по порядку, вложенные сразу после родителя. */
export function flattenCategories(tree: Category[], depth = 0): CategoryOption[] {
  return [...tree]
    .sort((a, b) => a.position - b.position)
    .flatMap((category) => [
      { id: category.id, name: category.name, depth },
      ...flattenCategories(category.children, depth + 1),
    ]);
}
