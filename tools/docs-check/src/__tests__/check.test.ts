import { describe, expect, it } from 'vitest';

import { checkDocs, frontMatter, relativeLinks } from '../check.ts';

const meta = '---\nstatus: accepted\nowner: founder\nupdated: 2026-11-08\n---\n';

const run = (files: Record<string, string>, extra: string[] = [], sections = ['docs/01-x']) => {
  const docs = new Map(Object.entries(files));
  const paths = new Set([...docs.keys(), ...extra]);
  return checkDocs(docs, (path) => paths.has(path) || [...paths].some((p) => p.startsWith(`${path}/`)), sections);
};

describe('relativeLinks', () => {
  it('приводит к пути от корня, пропускает внешние, якоря и код', () => {
    const text = '[a](../b.md#x) [c](https://x.y) [d](#top) [e](f.ts:12) `[g](nope.md)` [h](sub/)';
    expect(relativeLinks('docs/01-x/a.md', text)).toEqual(['docs/b.md', 'docs/01-x/f.ts', 'docs/01-x/sub']);
  });
});

describe('frontMatter', () => {
  it('читает поля и отбрасывает комментарий', () => {
    expect(frontMatter('---\nstatus: proposed   # proposed | accepted\n---\n')).toEqual({ status: 'proposed' });
    expect(frontMatter('# без шапки')).toBeNull();
  });
});

describe('checkDocs', () => {
  it('в порядке — ошибок нет', () => {
    expect(run({ 'docs/01-x/README.md': '[a](a.md)', 'docs/01-x/a.md': `${meta}текст` })).toEqual([]);
  });

  it('битая ссылка', () => {
    expect(run({ 'docs/01-x/README.md': '[a](a.md) [b](b.md)', 'docs/01-x/a.md': meta })).toEqual([
      'docs/01-x/README.md: ссылка на несуществующий docs/01-x/b.md',
    ]);
  });

  it('документ не в оглавлении раздела', () => {
    expect(run({ 'docs/01-x/README.md': '', 'docs/01-x/a.md': meta })).toEqual([
      'docs/01-x/README.md: нет ссылки на a.md',
    ]);
  });

  it('нет front matter или неверный статус; README и status.md без шапки можно', () => {
    const errors = run({
      'docs/01-x/README.md': '[a](a.md) [b](b.md)',
      'docs/01-x/a.md': 'текст',
      'docs/01-x/b.md': '---\nstatus: done\nowner: x\nupdated: 1\n---',
      'docs/status.md': 'текст',
    });
    expect(errors).toEqual([
      'docs/01-x/a.md: нет front matter',
      'docs/01-x/b.md: недопустимый статус «done» (можно: draft, review, accepted, outdated)',
    ]);
  });

  it('статус в журнале ADR расходится с самим ADR', () => {
    const adr = 'docs/02-architecture/adr';
    const errors = run(
      {
        [`${adr}/README.md`]: '| № | Решение | Статус |\n|---|---|---|\n| [0001](0001-a.md) | А | accepted |',
        [`${adr}/0001-a.md`]: '---\nstatus: superseded by 0002\ndate: 2026-11-08\ndeciders: founder\n---',
      },
      [],
      [adr],
    );
    expect(errors).toEqual([`${adr}/README.md: у 0001 статус «accepted», в самом ADR — «superseded by 0002»`]);
  });
});
