// Разработка API: `tsc --watch` пересобирает dist, `node --watch` перезапускает сервер.
// Не tsx/esbuild: они не выдают метаданные декораторов, без них DI в Nest не работает (pitfalls.md).
import { spawn, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
const project = ['-p', 'tsconfig.build.json'];

const first = spawnSync(process.execPath, [tsc, ...project], { stdio: 'inherit' });
if (first.status !== 0) process.exit(first.status ?? 1);

const children = [
  spawn(process.execPath, [tsc, ...project, '--watch', '--preserveWatchOutput'], { stdio: 'inherit' }),
  spawn(process.execPath, ['--env-file-if-exists=../../.env', '--watch', 'dist/main.js'], { stdio: 'inherit' }),
];

const stop = () => {
  for (const child of children) child.kill();
  process.exit(0);
};
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
