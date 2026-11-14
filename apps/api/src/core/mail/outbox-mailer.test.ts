import { mkdtemp, readdir, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { OutboxMailer } from './mail.module.js';

describe('письма в папку (разработка и e2e)', () => {
  let dir: string | undefined;
  afterEach(async () => {
    if (dir) await rm(dir, { recursive: true, force: true });
  });

  it('каждое письмо — отдельный JSON-файл, по имени файлы идут в порядке отправки', async () => {
    dir = join(await mkdtemp(join(tmpdir(), 'outbox-')), 'mail');
    const mailer = new OutboxMailer(dir);
    await mailer.send({ to: 'a@shop.test', subject: 'Первое', text: 'ссылка 1' });
    await new Promise((resolve) => setTimeout(resolve, 5));
    await mailer.send({ to: 'b@shop.test', subject: 'Второе', text: 'ссылка 2' });

    const files = (await readdir(dir)).sort();
    expect(files).toHaveLength(2);
    const mails = await Promise.all(files.map(async (file) => JSON.parse(await readFile(join(dir!, file), 'utf8'))));
    expect(mails).toEqual([
      { to: 'a@shop.test', subject: 'Первое', text: 'ссылка 1' },
      { to: 'b@shop.test', subject: 'Второе', text: 'ссылка 2' },
    ]);
  });
});
