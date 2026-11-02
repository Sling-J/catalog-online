import type { Category } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import { flattenCategories } from '../flatten-categories';

const node = (id: string, position: number, children: Category[] = []): Category => ({
  id,
  name: id,
  parentId: null,
  position,
  productCount: 0,
  children,
});

describe('flattenCategories', () => {
  it('по порядку, вложенные — сразу после родителя', () => {
    const tree = [node('b', 1), node('a', 0, [node('a2', 1), node('a1', 0)])];
    expect(flattenCategories(tree).map(({ id, depth }) => `${id}:${depth}`)).toEqual(['a:0', 'a1:1', 'a2:1', 'b:0']);
  });
});
