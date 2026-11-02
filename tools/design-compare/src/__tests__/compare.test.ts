import { describe, expect, it } from 'vitest';

import { blobMap, boardHtml } from '../board.ts';
import { compareItems, diffPair } from '../compare.ts';
import type { Item } from '../types.ts';

const item = (text: string, patch: Partial<Item> = {}): Item => ({
  text,
  x: 16,
  y: 100,
  w: 80,
  h: 18,
  input: false,
  fontSize: 15,
  fontWeight: 600,
  letterSpacing: 0,
  color: [23, 19, 61, 255],
  box: null,
  ...patch,
});

describe('diffPair', () => {
  it('в пределах допуска — без расхождений', () => {
    expect(diffPair(item('Товары'), item('Товары', { x: 16.6, h: 18.9 }), { tolerance: 1, maxShift: 24 })).toEqual([]);
  });

  it('положение, шрифт, цвет и подложка', () => {
    const design = item('Скрыть', {
      box: { x: 0, y: 90, w: 82, h: 34, bg: [255, 255, 255, 36], radius: 999, text: 'Скрыть' },
    });
    const app = item('Скрыть', {
      y: 104,
      fontSize: 14,
      color: [74, 69, 128, 255],
      box: { x: 0, y: 90, w: 82, h: 38, bg: [255, 255, 255, 36], radius: 19, text: 'Скрыть' },
    });
    expect(diffPair(design, app, { tolerance: 1, maxShift: 24 })).toEqual([
      'y 100→104 (+4)',
      'шрифт 15→14px',
      'цвет #17133d→#4a4580',
      'подложка: высота 34→38 (+4)',
    ]);
  });

  it('у поля ширину не сравниваем', () => {
    expect(
      diffPair(item('Поиск', { w: 200 }), item('Поиск', { w: 300, input: true }), { tolerance: 1, maxShift: 24 }),
    ).toEqual([]);
  });
});

describe('compareItems', () => {
  it('повторы — по ближайшему, далёкие и без пары — в списках «только в…»', () => {
    const report = compareItems(
      [item('шт.'), item('шт.', { y: 200 }), item('214')],
      [item('шт.', { y: 203 }), item('шт.', { y: 500 }), item('37')],
      { tolerance: 1, maxShift: 24 },
    );
    expect(report).toMatchObject({ matched: 1, total: 3, onlyDesign: ['шт.', '214'], onlyApp: ['шт.', '37'] });
    expect(report.diffs).toEqual([{ text: 'шт.', y: 200, problems: ['y 200→203 (+3)'] }]);
  });
});

describe('boardHtml', () => {
  it('без рантайма холста, фото — по своим адресам', () => {
    const blobs = blobMap('| 1260977f2c0c34a5b933572bb6e99e94 | jacket.jpg |');
    const source =
      '<script src="./support.js"></script><img src="/_blob/1260977f2c0c34a5b933572bb6e99e94">' +
      '<script type="text/x-dc" data-dc-script>class Component extends DCLogic {}</script>';
    expect(boardHtml(source, blobs, (file) => `/photos/${file}`)).toBe('<img src="/photos/jacket.jpg">');
  });
});
