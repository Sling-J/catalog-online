import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';

// Общий каталог строк компонентов `@catalog/ui`. Приложения подгружают его вместе со своим.
// Казахский добавится в locales, когда дойдём до перевода (NFR-6).
export default defineConfig({
  sourceLocale: 'ru',
  locales: ['ru'],
  // без путей к исходникам: тот же файл обновляет и конфиг apps/web
  format: formatter({ origins: false }),
  catalogs: [{ path: '<rootDir>/src/locales/{locale}', include: ['<rootDir>/src'] }],
});
