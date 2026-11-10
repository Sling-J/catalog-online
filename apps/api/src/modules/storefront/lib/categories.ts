import type { StorefrontCategory } from '@catalog/contract';

export type CategoryCountRow = {
  id: string;
  name: string;
  parentId: string | null;
  position: number;
  /** Товары витрины прямо в этой категории (без подкатегорий). */
  productCount: number;
};

/**
 * Дерево витрины (FR-V2): у родителя в числе — и товары подкатегорий (переход в категорию их показывает), пустые
 * категории не показываются. Порядок — `position`, при равенстве — имя.
 */
export function storefrontCategoryTree(rows: CategoryCountRow[]): StorefrontCategory[] {
  const byOrder = (a: CategoryCountRow, b: CategoryCountRow) => a.position - b.position || a.name.localeCompare(b.name);
  const sorted = [...rows].sort(byOrder);
  return sorted
    .filter((row) => row.parentId === null)
    .map((root) => {
      const children = sorted
        .filter((row) => row.parentId === root.id && row.productCount > 0)
        .map((child) => ({ id: child.id, name: child.name, productCount: child.productCount, children: [] }));
      const productCount = root.productCount + children.reduce((sum, child) => sum + child.productCount, 0);
      return { id: root.id, name: root.name, productCount, children };
    })
    .filter((root) => root.productCount > 0);
}
