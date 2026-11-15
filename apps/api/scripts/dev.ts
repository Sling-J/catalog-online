// Разработка API: `tsc --watch` пересобирает dist, `node --watch` перезапускает сервер и процесс задач — их два,
// как в продакшене (T-607): API задачи только ставит, `worker.js` выполняет.
// Не tsx/esbuild: они не выдают метаданные декораторов, без них DI в Nest не работает (pitfalls.md).
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { availableParallelism } from 'node:os';

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const project = ['-p', 'tsconfig.build.json'];

const first = spawnSync(process.execPath, [tsc, ...project], { stdio: 'inherit' });
if (first.status !== 0) process.exit(first.status ?? 1);

// Потоки libuv (argon2, sharp, crypto, DNS; scaling.md SC4, T-610): по умолчанию 4. libuv читает переменную только
// из окружения при запуске процесса — ни из кода, ни из `--env-file` она не действует (pitfalls.md); в продакшене —
// окружение сервисов api и worker (T-602).
const env = {
  ...process.env,
  UV_THREADPOOL_SIZE: process.env.UV_THREADPOOL_SIZE ?? String(Math.max(4, availableParallelism())),
};

const children = [
  spawn(process.execPath, [tsc, ...project, '--watch', '--preserveWatchOutput'], { stdio: 'inherit' }),
  spawn(process.execPath, ['--env-file-if-exists=../../.env', '--watch', 'dist/main.js'], { stdio: 'inherit', env }),
  spawn(process.execPath, ['--env-file-if-exists=../../.env', '--watch', 'dist/worker.js'], { stdio: 'inherit', env }),
];

const stop = () => {
  for (const child of children) child.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
