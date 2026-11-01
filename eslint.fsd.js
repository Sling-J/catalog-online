// Границы Feature-Sliced Design для фронтов (apps/web, apps/admin).
// Правила: docs/02-architecture/frontend-structure.md (ADR 0002).
import { existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const LAYERS = ['app', 'page', 'widget', 'feature', 'entity'];
const below = (i) => [...LAYERS.slice(i + 1), 'shared'];

const SLICE_FOLDERS = ['pages', 'widgets', 'features', 'entities'];
const SELF_INDEX_MESSAGE = 'Внутри среза импортируй по сегменту, не через корневой index.ts';

// Плагин не смотрит импорты внутри одного среза, поэтому запрет импорта среза
// через его же корневой index.ts (циклы) задаём отдельно для каждой папки среза.
const selfIndexRules = (appDir) =>
  SLICE_FOLDERS.flatMap((folder) => {
    const dir = resolve(appDir, 'src', folder);
    if (!existsSync(dir)) return [];
    return readdirSync(dir, { withFileTypes: true })
      .filter((d) => d.isDirectory())
      .map((d) => ({
        files: [`${appDir}/src/${folder}/${d.name}/**/*.{ts,tsx}`],
        rules: {
          'no-restricted-imports': [
            'error',
            { paths: [{ name: `@/${folder}/${d.name}`, message: SELF_INDEX_MESSAGE }] },
          ],
        },
      }));
  });

/** @param {string} appDir путь к приложению от корня репозитория, например 'apps/web' */
export function fsdBoundaries(appDir) {
  const absDir = resolve(import.meta.dirname, appDir);
  return [
    {
      files: [`${appDir}/src/**/*.{ts,tsx}`],
      languageOptions: { parser: tseslint.parser },
      plugins: { boundaries },
      settings: {
        'boundaries/root-path': absDir,
        'import/resolver': { typescript: { project: resolve(absDir, 'tsconfig.json') } },
        'boundaries/elements': [
          { type: 'app', pattern: 'src/app' },
          { type: 'page', pattern: 'src/pages/*', capture: ['slice'] },
          { type: 'widget', pattern: 'src/widgets/*', capture: ['slice'] },
          { type: 'feature', pattern: 'src/features/*', capture: ['slice'] },
          { type: 'entity', pattern: 'src/entities/*', capture: ['slice'] },
          // shared/constants и shared/types импортируются по файлу, остальное — через index.ts
          { type: 'shared-open', pattern: 'src/shared/{constants,types}', capture: ['segment'] },
          { type: 'shared', pattern: 'src/shared/*', capture: ['segment'] },
        ],
      },
      rules: {
        'boundaries/dependencies': [
          'error',
          {
            default: 'disallow',
            policies: [
              ...LAYERS.map((layer, i) => ({
                from: { element: { type: layer } },
                allow: { to: { element: { type: below(i), fileInternalPath: 'index.ts' } } },
              })),
              ...LAYERS.map((layer) => ({
                from: { element: { type: layer } },
                allow: { to: { element: { type: 'shared-open' } } },
              })),
              {
                from: { element: { type: ['shared', 'shared-open'] } },
                allow: { to: { element: { type: ['shared', 'shared-open'] } } },
              },
            ],
          },
        ],
      },
    },
    ...selfIndexRules(appDir),
  ];
}
