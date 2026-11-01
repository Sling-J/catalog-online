import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';

// Два каталога: строки витрины и строки компонентов `@catalog/ui` (тот же файл, что извлекает сам пакет).
// Vite-плагин компилирует только объявленные каталоги, поэтому общий объявлен и здесь.
// Без путей к исходникам в .po (`origins: false`), иначе два конфига переписывали бы друг у друга ссылки.
export default defineConfig({
  sourceLocale: 'ru',
  locales: ['ru'],
  format: formatter({ origins: false }),
  catalogs: [
    { path: '<rootDir>/src/app/i18n/locales/{locale}', include: ['<rootDir>/src'] },
    { path: '<rootDir>/../../packages/ui/src/locales/{locale}', include: ['<rootDir>/../../packages/ui/src'] },
  ],
});
