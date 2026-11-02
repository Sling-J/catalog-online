import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** Корень репозитория: инструмент лежит в tools/design-compare/src. */
export const ROOT = resolve(import.meta.dirname, '../../..');
const BOARDS = resolve(ROOT, 'design/canvas/boards');
const PHOTOS = resolve(ROOT, 'design-assets/storefront');

/** Фото холста `/_blob/<id>` → файлы design-assets: таблица в design/canvas/README.md. */
export function blobMap(readme: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const [, id, file] of readme.matchAll(/\| ([0-9a-f]{32}) \| ([\w-]+\.jpg) \|/g)) map.set(id!, file!);
  return map;
}

/**
 * Артборд как обычная страница: без рантайма холста (`support.js` и логики DCLogic — макеты статичные),
 * фото — по адресам, которые отдаёт `photoPath`.
 */
export function boardHtml(source: string, blobs: Map<string, string>, photoUrl: (file: string) => string): string {
  return source
    .replace(/<script src="\.\/support\.js"><\/script>/, '')
    .replace(/<script type="text\/x-dc"[\s\S]*?<\/script>/, '')
    .replace(/\/_blob\/([0-9a-f]{32})/g, (match, id: string) => {
      const file = blobs.get(id);
      return file ? photoUrl(file) : match;
    });
}

export const readBoard = (name: string) =>
  readFileSync(resolve(BOARDS, `${name.replace(/\.dc\.html$/, '')}.dc.html`), 'utf8');
export const readCanvasReadme = () => readFileSync(resolve(ROOT, 'design/canvas/README.md'), 'utf8');
export const photoPath = (file: string) => resolve(PHOTOS, file);
