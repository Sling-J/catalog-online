import { existsSync } from 'node:fs';

import { defineConfig } from 'drizzle-kit';

// drizzle-kit сам .env не читает; берём корневой, как `pnpm dev` и `pnpm start` у API.
if (existsSync('../../.env')) process.loadEnvFile('../../.env');

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/core/db/schema/index.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
