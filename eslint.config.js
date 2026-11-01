// Общий ESLint для всего монорепо (flat config). Пакеты запускают `eslint .`,
// конфиг находится подъёмом по папкам.
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import { fsdBoundaries } from './eslint.fsd.js';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/coverage/**',
      '**/.turbo/**',
      '**/src/gen/**',
      '**/src/locales/**/*.ts',
      'design-assets/**',
      'design/canvas/**',
      'docs/**',
      '.claude/**',
      '.impeccable/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
  ...fsdBoundaries('apps/web'),
  ...fsdBoundaries('apps/admin'),
  prettier,
);
