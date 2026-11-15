import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';

// Строки суперадминки без переводов (ADR 0005). Конфиг нужен плагину Vite, чтобы раскрыть макросы в компонентах
// `@catalog/ui`: объявлен только их каталог, тот же, что у админки и витрины.
export default defineConfig({
  sourceLocale: 'ru',
  locales: ['ru'],
  format: formatter({ origins: false }),
  catalogs: [
    { path: '<rootDir>/../../packages/ui/src/locales/{locale}', include: ['<rootDir>/../../packages/ui/src'] },
  ],
});
