import { Injectable, type OnModuleInit } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createTestApp, type TestApp } from '../../../test/helpers/app.js';
import { connectTestDb } from '../../../test/helpers/db.js';
import type { Db } from '../db/index.js';
import { defineJob, Jobs, JOBS_SCHEMA } from './index.js';

const ECHO = defineJob<{ n: string }>('test.echo', { retryLimit: 1, retryDelay: 0 });
const seen: { n: string; last: boolean }[] = [];

/** Тестовая задача: запоминает вызовы; `flaky` падает на первой попытке. */
@Injectable()
class EchoWorker implements OnModuleInit {
  constructor(private readonly jobs: Jobs) {}

  onModuleInit(): void {
    this.jobs.work(ECHO, async (data, attempt) => {
      seen.push({ n: data.n, last: attempt.last });
      if (data.n === 'flaky' && !attempt.last) throw new Error('первая попытка падает');
    });
  }
}

/** Ждать, пока условие не выполнится (pg-boss опрашивает очередь раз в 2 секунды). */
async function waitFor(check: () => boolean, timeoutMs = 20_000): Promise<void> {
  const started = Date.now();
  while (!check()) {
    if (Date.now() - started > timeoutMs) throw new Error('Не дождались');
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
}

describe('фоновые задачи (pg-boss)', () => {
  let t: TestApp;
  let jobs: Jobs;
  let db: Db;
  let closeDb: () => Promise<void>;

  beforeAll(async () => {
    t = await createTestApp({ providers: [EchoWorker], realJobs: true });
    jobs = t.app.get(Jobs);
    ({ db, close: closeDb } = connectTestDb(t.config.databaseUrl));
  });
  afterAll(async () => {
    await closeDb?.();
    await t?.close();
  });

  const has = (n: string) => seen.some((call) => call.n === n);

  it('поставленная задача выполняется', async () => {
    await jobs.send(ECHO, { n: 'plain' });
    await waitFor(() => has('plain'));
  });

  it('из транзакции: откатилась — задачи нет, зафиксировалась — выполняется', async () => {
    await db
      .transaction(async (tx) => {
        await jobs.send(ECHO, { n: 'rolled-back' }, tx);
        tx.rollback();
      })
      .catch(() => {});
    await db.transaction(async (tx) => {
      await jobs.send(ECHO, { n: 'committed' }, tx);
    });
    await waitFor(() => has('committed'));

    const rows = await db.execute<{ count: number }>(
      sql`select count(*)::int as count from ${sql.identifier(JOBS_SCHEMA)}.job where name = 'test.echo' and data->>'n' = 'rolled-back'`,
    );
    expect(rows[0]?.count).toBe(0);
    expect(has('rolled-back')).toBe(false);
  });

  it('упала — повторяется; на последней попытке обработчик знает, что она последняя', async () => {
    await jobs.send(ECHO, { n: 'flaky' });
    await waitFor(() => seen.filter((call) => call.n === 'flaky').length === 2);
    expect(seen.filter((call) => call.n === 'flaky').map((call) => call.last)).toEqual([false, true]);
  });

  it('расписания модулей записаны в pg-boss', async () => {
    const rows = await db.execute<{ name: string; cron: string }>(
      sql`select name, cron from ${sql.identifier(JOBS_SCHEMA)}.schedule`,
    );
    expect(rows.map((row) => [row.name, row.cron])).toContainEqual(['uploads.cleanup', '30 21 * * *']);
  });
});
