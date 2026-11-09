import { describe, expect, it } from 'vitest';

import { buildTree, categoryPath, normalizeOrder, orderErrors } from './tree.js';

const A = 'a';
const B = 'b';
const C = 'c';
const current = [
  { id: A, name: 'Девочки' },
  { id: B, name: 'Мальчики' },
  { id: C, name: 'Куртки' },
];

describe('дерево категорий', () => {
  it('два уровня по позиции, у родителя — только свои товары', () => {
    const tree = buildTree([
      { id: C, name: 'Куртки', parentId: A, position: 0, productCount: 3 },
      { id: B, name: 'Мальчики', parentId: null, position: 0, productCount: 0 },
      { id: A, name: 'Девочки', parentId: null, position: 1, productCount: 1 },
    ]);
    expect(tree.map((node) => [node.name, node.productCount, node.children.map((child) => child.name)])).toEqual([
      ['Мальчики', 0, []],
      ['Девочки', 1, ['Куртки']],
    ]);
  });

  it('путь для импорта', () => {
    expect(categoryPath('Куртки', null)).toBe('Куртки');
    expect(categoryPath('Куртки', 'Девочки')).toBe('Девочки / Куртки');
  });

  it('порядок: ровно все категории по разу', () => {
    const ok = [
      { id: A, parentId: null, position: 0 },
      { id: B, parentId: null, position: 1 },
      { id: C, parentId: A, position: 0 },
    ];
    expect(orderErrors(current, ok)).toEqual([]);
    expect(orderErrors(current, ok.slice(0, 2))).toEqual([{ field: 'items', code: 'invalid_value' }]);
    expect(orderErrors(current, [...ok.slice(0, 2), { id: A, parentId: null, position: 2 }])).toEqual([
      { field: 'items', code: 'invalid_value' },
    ]);
    expect(orderErrors(current, [...ok.slice(0, 2), { id: 'x', parentId: null, position: 2 }])).toEqual([
      { field: 'items', code: 'invalid_value' },
    ]);
  });

  it('порядок: не больше 2 уровней, не сама в себя, родитель существует', () => {
    // C внутри A, A внутри B — третий уровень
    expect(
      orderErrors(current, [
        { id: A, parentId: B, position: 0 },
        { id: B, parentId: null, position: 0 },
        { id: C, parentId: A, position: 0 },
      ]),
    ).toEqual([
      { field: 'items.0.parentId', code: 'invalid_value' },
      { field: 'items.2.parentId', code: 'invalid_value' },
    ]);
    expect(
      orderErrors(current, [
        { id: A, parentId: A, position: 0 },
        { id: B, parentId: null, position: 0 },
        { id: C, parentId: null, position: 1 },
      ]),
    ).toEqual([{ field: 'items.0.parentId', code: 'invalid_value' }]);
  });

  it('порядок: одинаковые имена у новых соседей без учёта регистра', () => {
    const names = [...current, { id: 'd', name: 'куртки' }];
    const items = [
      { id: A, parentId: null, position: 0 },
      { id: B, parentId: null, position: 1 },
      { id: C, parentId: A, position: 0 },
      { id: 'd', parentId: A, position: 1 },
    ];
    expect(orderErrors(names, items)).toEqual([{ field: 'items.3.id', code: 'duplicate' }]);
    expect(orderErrors(names, [...items.slice(0, 3), { id: 'd', parentId: B, position: 0 }])).toEqual([]);
  });

  it('позиции подряд внутри родителя; равные — по порядку в запросе', () => {
    const order = normalizeOrder([
      { id: A, parentId: null, position: 5 },
      { id: B, parentId: null, position: 5 },
      { id: C, parentId: A, position: 9 },
    ]);
    expect(order).toEqual([
      { id: A, parentId: null, position: 0 },
      { id: B, parentId: null, position: 1 },
      { id: C, parentId: A, position: 0 },
    ]);
  });
});
