// Админка, витрина и суперадминка для e2e — продакшен-сборки (T-502): так проверяются запросы, которые увидит покупатель, без
// артефактов разработки (StrictMode монтирует компоненты дважды и отменяет запросы, Vite компилирует модули при
// первом заходе). Собирает контракт (приложения берут его из `dist`), затем приложения с адресами e2e и
// запускает `vite preview` каждого. Turbo не используем: он мог бы взять из кеша сборку с другими переменными.
import { spawn, spawnSync, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';

import { adminEnv, PORTS, ROOT, staffEnv, webEnv } from '../e2e-env.ts';

const shell = process.platform === 'win32';

function run(title: string, cwd: string, args: string[], env: Record<string, string> = {}): void {
  console.log(`[e2e fronts] ${title}`);
  const result = spawnSync('pnpm', args, { cwd, env: { ...process.env, ...env }, stdio: 'inherit', shell });
  if (result.status !== 0) throw new Error(`[e2e fronts] не получилось: ${title}`);
}

const ADMIN = resolve(ROOT, 'apps/admin');
const WEB = resolve(ROOT, 'apps/web');
const STAFF = resolve(ROOT, 'apps/staff');

run('сборка @catalog/contract', resolve(ROOT, 'packages/contract'), ['run', 'build']);
// админка — в свою папку, чтобы не путать со сборкой `pnpm build`; витрина (TanStack Start) другую папку не умеет
run('сборка админки', ADMIN, ['exec', 'vite', 'build', '--outDir', 'dist-e2e'], adminEnv);
run('сборка витрины', WEB, ['exec', 'vite', 'build'], webEnv);
run('сборка суперадминки', STAFF, ['exec', 'vite', 'build', '--outDir', 'dist-e2e'], staffEnv);

const children: ChildProcess[] = [
  spawn('pnpm', ['exec', 'vite', 'preview', '--outDir', 'dist-e2e', '--port', String(PORTS.admin), '--strictPort'], {
    cwd: ADMIN,
    env: { ...process.env, ...adminEnv },
    stdio: 'inherit',
    shell,
  }),
  spawn('pnpm', ['exec', 'vite', 'preview', '--port', String(PORTS.web), '--strictPort'], {
    cwd: WEB,
    env: { ...process.env, ...webEnv },
    stdio: 'inherit',
    shell,
  }),
  spawn('pnpm', ['exec', 'vite', 'preview', '--outDir', 'dist-e2e', '--port', String(PORTS.staff), '--strictPort'], {
    cwd: STAFF,
    env: { ...process.env, ...staffEnv },
    stdio: 'inherit',
    shell,
  }),
];
const stop = () => children.forEach((child) => child.kill());
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
process.on('exit', stop);
for (const child of children) child.on('exit', (code) => process.exit(code ?? 0));
