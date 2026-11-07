import type { Category } from '@catalog/contract';
import { describe, expect, it } from 'vitest';

import {
  categoryGroups,
  moveToParent,
  orderFromGroups,
  ROOT_GROUP,
  sameGroups,
  treeFromGroups,
} from '../category-order';

const node = (id: string, position: number, children: Category[] = [], parentId: string | null = null): Category => ({
  id,
  name: id,
  parentId,
  position,
  productCount: 0,
  children,
});

// b идёт первой по position, у a — подкатегория a1
const tree = [node('a', 1, [node('a1', 0, [], 'a')]), node('b', 0)];

describe('порядок категорий', () => {
  it('группы — по position, у каждой категории верхнего уровня своя', () => {
    expect(categoryGroups(tree)).toEqual({ [ROOT_GROUP]: ['b', 'a'], b: [], a: ['a1'] });
  });

  it('тело запроса и дерево из групп', () => {
    const groups = { [ROOT_GROUP]: ['a', 'b'], a: [], b: ['a1'] };
    expect(orderFromGroups(groups)).toEqual([
      { id: 'a', parentId: null, position: 0 },
      { id: 'b', parentId: null, position: 1 },
      { id: 'a1', parentId: 'b', position: 0 },
    ]);
    const next = treeFromGroups(tree, groups);
    expect(next.map((item) => item.id)).toEqual(['a', 'b']);
    expect(next[1]!.children).toMatchObject([{ id: 'a1', parentId: 'b', position: 0 }]);
  });

  it('перенос: внутрь — в конец родителя, наружу — в конец верхнего уровня', () => {
    expect(moveToParent(tree, 'b', 'a')).toEqual({ [ROOT_GROUP]: ['a'], a: ['a1', 'b'] });
    expect(moveToParent(tree, 'a1', null)).toEqual({ [ROOT_GROUP]: ['b', 'a', 'a1'], b: [], a: [], a1: [] });
  });

  it('вернули на место — изменений нет', () => {
    expect(sameGroups(categoryGroups(tree), { [ROOT_GROUP]: ['b', 'a'], a: ['a1'], b: [] })).toBe(true);
    expect(sameGroups(categoryGroups(tree), { [ROOT_GROUP]: ['a', 'b'], a: ['a1'], b: [] })).toBe(false);
  });
});
