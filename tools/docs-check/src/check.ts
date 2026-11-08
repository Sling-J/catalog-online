// Проверки документации без доступа к диску: на вход — карта «путь → текст» и список папок.
// Правила — docs/06-process/documentation-rules.md, раздел 4.
import { posix } from 'node:path';

export type Docs = ReadonlyMap<string, string>;

const STATUSES = ['draft', 'review', 'accepted', 'outdated'];
const ADR_STATUSES = ['proposed', 'accepted', 'rejected'];
const LINK = /\]\(([^)\s]+)\)/g;

/** Убирает блоки кода: ссылки в примерах не проверяем. */
const withoutCode = (text: string): string => text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');

/** Относительные ссылки документа, приведённые к пути от корня репозитория (без якоря и `:строки`). */
export function relativeLinks(file: string, text: string): string[] {
  const found: string[] = [];
  for (const match of withoutCode(text).matchAll(LINK)) {
    const target = match[1]!;
    if (/^[a-z]+:/i.test(target) || target.startsWith('#')) continue;
    const path = target.split('#')[0]!.replace(/:\d+$/, '');
    if (!path) continue;
    found.push(posix.normalize(posix.join(posix.dirname(file), decodeURI(path))).replace(/\/$/, ''));
  }
  return found;
}

export function frontMatter(text: string): Record<string, string> | null {
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(text);
  if (!match) return null;
  const fields: Record<string, string> = {};
  for (const line of match[1]!.split(/\r?\n/)) {
    const pair = /^([\w-]+):\s*(.*?)\s*(#.*)?$/.exec(line);
    if (pair) fields[pair[1]!] = pair[2]!;
  }
  return fields;
}

/** Тематический документ `docs/`: не README раздела и не status.md. */
const needsFrontMatter = (file: string): boolean =>
  file.startsWith('docs/') &&
  posix.basename(file) !== 'README.md' &&
  file !== 'docs/status.md' &&
  !file.endsWith('/0000-template.md');

const isAdr = (file: string): boolean => /^docs\/02-architecture\/adr\/\d{4}-.+\.md$/.test(file);

/**
 * @param docs все `.md` репозитория, которые проверяем (путь от корня → текст)
 * @param exists есть ли файл или папка по пути от корня
 * @param sections папки разделов `docs/NN-*` и вложенные папки с README (например, `adr`)
 */
export function checkDocs(docs: Docs, exists: (path: string) => boolean, sections: string[]): string[] {
  const errors: string[] = [];

  for (const [file, text] of docs) {
    for (const target of relativeLinks(file, text)) {
      if (!exists(target)) errors.push(`${file}: ссылка на несуществующий ${target}`);
    }

    if (needsFrontMatter(file)) {
      const fields = frontMatter(text);
      const allowed = isAdr(file) ? ADR_STATUSES : STATUSES;
      const required = isAdr(file) ? ['status', 'date', 'deciders'] : ['status', 'owner', 'updated'];
      if (!fields) {
        errors.push(`${file}: нет front matter`);
      } else {
        for (const key of required) if (!fields[key]) errors.push(`${file}: в front matter нет «${key}»`);
        const status = fields.status ?? '';
        if (status && !allowed.includes(status) && !/^superseded by \d{4}$/.test(status)) {
          errors.push(`${file}: недопустимый статус «${status}» (можно: ${allowed.join(', ')})`);
        }
      }
    }
  }

  for (const section of sections) {
    const readme = `${section}/README.md`;
    const text = docs.get(readme);
    if (text === undefined) {
      errors.push(`${section}: нет README.md`);
      continue;
    }
    const linked = new Set(relativeLinks(readme, text));
    for (const file of docs.keys()) {
      if (posix.dirname(file) !== section || file === readme) continue;
      if (file.endsWith('0000-template.md')) continue;
      if (!linked.has(file)) errors.push(`${readme}: нет ссылки на ${posix.basename(file)}`);
    }
  }

  const adrIndex = docs.get('docs/02-architecture/adr/README.md');
  if (adrIndex) {
    for (const row of adrIndex.matchAll(/^\|\s*\[(\d{4})\]\(([^)]+)\)\s*\|.*\|\s*([^|]+?)\s*\|\s*$/gm)) {
      const file = posix.join('docs/02-architecture/adr', row[2]!);
      const status = frontMatter(docs.get(file) ?? '')?.status;
      if (status && status !== row[3]) {
        errors.push(`docs/02-architecture/adr/README.md: у ${row[1]} статус «${row[3]}», в самом ADR — «${status}»`);
      }
    }
  }

  return errors;
}
