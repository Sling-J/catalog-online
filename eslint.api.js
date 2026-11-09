// Границы кода бэкенда (apps/api). Правила: docs/02-architecture/backend-structure.md, разделы 4 и 13 (ADR 0004).
import { resolve } from 'node:path';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';

const API = 'apps/api';
const SRC = `${API}/src`;

/** Сервисы, контроллеры и прочее внутри модуля — только чужой `*.module.ts` и экспортированный `*.service.ts`. */
const MODULE_PUBLIC = ['*.module.ts', '*.service.ts'];

export function apiBoundaries() {
  const absDir = resolve(import.meta.dirname, API);
  return [
    {
      files: [`${API}/**/*.ts`],
      languageOptions: {
        parser: tseslint.parser,
        // consistent-type-imports должен знать о метаданных декораторов: класс, который Nest внедряет
        // через конструктор, нельзя превращать в `import type` — пропадёт из метаданных, и DI сломается.
        parserOptions: { emitDecoratorMetadata: true, experimentalDecorators: true },
      },
    },
    {
      files: [`${SRC}/**/*.ts`],
      plugins: { boundaries },
      settings: {
        'boundaries/root-path': absDir,
        'import/resolver': { typescript: { project: resolve(absDir, 'tsconfig.json') } },
        'boundaries/elements': [
          // Файлы сборки (main.ts, app.module.ts, core/core.module.ts) — вне элементов: собирают всё
          { type: 'core', pattern: 'src/core/*', partialMatch: false, capture: ['segment'] },
          { type: 'module', pattern: 'src/modules/*', partialMatch: false, capture: ['module'] },
        ],
      },
      rules: {
        'boundaries/dependencies': [
          'error',
          {
            default: 'disallow',
            policies: [
              // core — только сам себя, через index.ts папки; modules не видит
              {
                from: { element: { type: 'core' } },
                allow: { to: { element: { type: 'core', fileInternalPath: 'index.ts' } } },
              },
              // Модуль: core через index.ts, чужой модуль — только его module и service (не репозиторий)
              {
                from: { element: { type: 'module' } },
                allow: { to: { element: { type: 'core', fileInternalPath: 'index.ts' } } },
              },
              {
                from: { element: { type: 'module' } },
                allow: { to: { element: { type: 'module', fileInternalPath: MODULE_PUBLIC } } },
              },
            ],
          },
        ],
        // Окружение читается только в core/config (раздел 10)
        'no-restricted-properties': [
          'error',
          {
            object: 'process',
            property: 'env',
            message: 'Переменные окружения — только через AppConfig (core/config).',
          },
        ],
        // SQL — только в репозиториях и core/db; Express — только в core (решение 3)
        'no-restricted-imports': [
          'error',
          {
            patterns: [
              {
                group: ['drizzle-orm', 'drizzle-orm/*', 'postgres'],
                allowTypeImports: true,
                message: 'SQL — только в *.repository.ts (backend-structure.md, раздел 4).',
              },
              { group: ['express'], message: 'Типы Express — только в core (backend-structure.md, решение 3).' },
            ],
          },
        ],
      },
    },
    {
      files: [`${SRC}/core/config/**/*.ts`],
      rules: { 'no-restricted-properties': 'off' },
    },
    {
      files: [`${SRC}/core/**/*.ts`, `${SRC}/**/*.repository.ts`],
      rules: {
        'no-restricted-imports': [
          'error',
          {
            patterns: [{ group: ['express'], allowTypeImports: true, message: 'Из Express — только типы.' }],
          },
        ],
      },
    },
    {
      // Репозиториям Express не нужен вовсе
      files: [`${SRC}/**/*.repository.ts`],
      rules: {
        'no-restricted-imports': [
          'error',
          { patterns: [{ group: ['express'], message: 'Типы Express — только в core.' }] },
        ],
      },
    },
  ];
}
