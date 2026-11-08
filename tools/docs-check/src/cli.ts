// pnpm docs:check — ссылки, front matter и оглавления в документах. Правила — docs/06-process/documentation-rules.md.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { posix, resolve } from 'node:path';

import { checkDocs } from './check.ts';

const root = resolve(import.meta.dirname, '../../..');
const tracked = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.md'], {
  cwd: root,
  encoding: 'utf8',
})
  .split('\n')
  .filter((file) => file && !file.startsWith('.claude/') && existsSync(resolve(root, file)));

const docs = new Map(tracked.map((file) => [file, readFileSync(resolve(root, file), 'utf8')]));
const sections = [
  ...new Set(
    tracked
      .filter((file) => /^docs\/\d{2}-[^/]+\//.test(file))
      .map((file) => posix.dirname(file))
      .filter((dir) => /^docs\/\d{2}-[^/]+$/.test(dir) || docs.has(`${dir}/README.md`)),
  ),
];

const errors = checkDocs(docs, (path) => existsSync(resolve(root, path)), sections);
if (errors.length > 0) {
  console.error(`Документация: ${errors.length} ошибок\n${errors.map((error) => `  ${error}`).join('\n')}`);
  process.exit(1);
}
console.log(`Документация: ${docs.size} файлов, ошибок нет`);
