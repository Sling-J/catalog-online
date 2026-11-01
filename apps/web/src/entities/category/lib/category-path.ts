import type { StorefrontCategory } from '@catalog/contract';

/** Цепочка от верхней категории до найденной; пустая, если такой категории нет в дереве. */
export function findCategoryPath(categories: StorefrontCategory[], id: string): StorefrontCategory[] {
  for (const category of categories) {
    if (category.id === id) return [category];
    const inner = findCategoryPath(category.children, id);
    if (inner.length > 0) return [category, ...inner];
  }
  return [];
}
