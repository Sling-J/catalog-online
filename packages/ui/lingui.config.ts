import { defineConfig } from '@lingui/cli';

// Общий каталог строк компонентов `@catalog/ui`. Приложения подгружают его вместе со своим.
// Казахский добавится в locales, когда дойдём до перевода (NFR-6).
export default defineConfig({
  sourceLocale: 'ru',
  locales: ['ru'],
  catalogs: [{ path: '<rootDir>/src/locales/{locale}', include: ['<rootDir>/src'] }],
});
