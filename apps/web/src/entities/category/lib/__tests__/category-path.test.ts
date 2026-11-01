import type { StorefrontCategory } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import { findCategoryPath } from '../category-path';

const category = (id: string, children: StorefrontCategory[] = []): StorefrontCategory => ({
  id,
  name: id,
  productCount: 1,
  children,
});

const tree = [category('outer', [category('spring'), category('winter', [category('down')])]), category('shoes')];

describe('findCategoryPath', () => {
  it('верхняя категория — цепочка из неё одной', () => {
    expect(findCategoryPath(tree, 'shoes').map((c) => c.id)).toEqual(['shoes']);
  });

  it('вложенная — вся цепочка от верхней', () => {
    expect(findCategoryPath(tree, 'down').map((c) => c.id)).toEqual(['outer', 'winter', 'down']);
  });

  it('неизвестная — пусто', () => {
    expect(findCategoryPath(tree, 'nope')).toEqual([]);
  });
});
