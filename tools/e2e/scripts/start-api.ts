// API для e2e (webServer Playwright): пересоздаёт базу `catalog_e2e`, собирает API, применяет миграции, готовит
// хранилища, кладёт демо-магазины сида и запускает API на своём порту. Playwright стартует webServer раньше
// globalSetup, поэтому подготовка базы — здесь (T-502).
import { spawn, spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

import postgres from 'postgres';

import { ADMIN_DATABASE_URL, apiEnv, MAIL_DIR, ROOT, storageCorsOrigins } from '../e2e-env.ts';

const API_DIR = resolve(ROOT, 'apps/api');
const env = { ...process.env, ...apiEnv };

function run(title: string, command: string, args: string[], extraEnv: Record<string, string> = {}): void {
  console.log(`[e2e api] ${title}`);
  const result = spawnSync(command, args, {
    cwd: API_DIR,
    env: { ...env, ...extraEnv },
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  if (result.status !== 0) throw new Error(`[e2e api] не получилось: ${title}`);
}

console.log('[e2e api] пересоздаю базу catalog_e2e');
const admin = postgres(ADMIN_DATABASE_URL, { max: 1, onnotice: () => {} });
try {
  await admin`select pg_terminate_backend(pid) from pg_stat_activity where datname = 'catalog_e2e' and pid <> pg_backend_pid()`;
  await admin`drop database if exists catalog_e2e`;
  await admin`create database catalog_e2e`;
} finally {
  await admin.end();
}
rmSync(MAIL_DIR, { recursive: true, force: true });

run('сборка API', 'pnpm', ['run', 'build']);
run('миграции', 'pnpm', ['exec', 'drizzle-kit', 'migrate']);
// хранилища общие с разработкой: CORS — для адресов обоих окружений
run('хранилища', 'node', ['dist/core/storage/setup/run.js'], { CORS_ORIGINS: storageCorsOrigins });
run('демо-магазины', 'node', ['dist/core/db/seed/run.js']);

console.log('[e2e api] запуск');
const api = spawn('node', ['dist/main.js'], { cwd: API_DIR, env, stdio: 'inherit' });
const stop = () => api.kill();
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
api.on('exit', (code) => process.exit(code ?? 0));
