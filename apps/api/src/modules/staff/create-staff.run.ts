// `pnpm --filter @catalog/api staff:create <почта>` — сотрудник суперадминки в базу из DATABASE_URL (корневой .env);
// почта уже есть — новый пароль. Пароль спрашивается в терминале без эха (в историю команд не попадает); без
// терминала — первая строка ввода: `echo 'пароль' | pnpm … staff:create почта`. Решение основателя 2026-11-10, T-412.
import { createInterface } from 'node:readline';

import { hashPassword, normalizeEmail } from '../../core/auth/index.js';
import { loadConfig } from '../../core/config/index.js';
import { connectDb } from '../../core/db/index.js';
import { staffRepository } from './staff.repository.js';

const MIN_PASSWORD = 12;

/** Строка из терминала; `hidden` — без эха (пароль). */
function ask(question: string, hidden: boolean): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
  if (hidden && process.stdin.isTTY) {
    const output = rl as unknown as { _writeToOutput: (text: string) => void };
    output._writeToOutput = (text) => {
      if (text.includes(question)) process.stdout.write(text);
    };
  }
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      if (hidden && process.stdin.isTTY) process.stdout.write('\n');
      resolve(answer);
    });
  });
}

const email = normalizeEmail(process.argv[2] ?? '');
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error('Укажите почту: pnpm --filter @catalog/api staff:create <почта>');
  process.exit(1);
}

const password = await ask('Пароль: ', true);
if (process.stdin.isTTY && (await ask('Ещё раз: ', true)) !== password) {
  console.error('Пароли не совпали.');
  process.exit(1);
}
if (password.length < MIN_PASSWORD) {
  console.error(`Пароль — не короче ${MIN_PASSWORD} символов.`);
  process.exit(1);
}

const { db, close } = connectDb(loadConfig().databaseUrl);
try {
  const result = await staffRepository.upsertStaff(db, email, await hashPassword(password));
  console.log(result === 'created' ? `Сотрудник ${email} создан.` : `Пароль сотрудника ${email} изменён.`);
} finally {
  await close();
}
