// Таблицы Drizzle по областям (backend-structure.md, раздел 3; data-model.md). Колонки в TypeScript — camelCase,
// в базе — snake_case (`casing` в drizzle() и drizzle.config.ts). Изменили схему — `pnpm --filter @catalog/api db:generate`.
export * from './catalog.js';
export * from './imports.js';
export * from './shops.js';
export * from './staff.js';
export * from './stats.js';
