import { Jobs, type JobAttempt, type JobDefinition } from '../../src/core/jobs/index.js';
import type { DbOrTx } from '../../src/core/db/index.js';

type SentJob = { name: string; data: object };

/**
 * Очередь e2e в памяти: задачи складываются в `sent`, тест запускает их сам — `drain()` или `run()`. Транзакцию
 * не учитывает (что задача из откатившейся транзакции не появится — проверяет `jobs.e2e.test.ts` на pg-boss).
 */
export class MemoryJobs extends Jobs {
  readonly sent: SentJob[] = [];

  async send<T extends object>(job: JobDefinition<T>, data: T, _tx?: DbOrTx): Promise<void> {
    if (!this.handlers.has(job.name)) throw new Error(`Нет обработчика задачи ${job.name}`);
    this.sent.push({ name: job.name, data });
  }

  /** Выполнить обработчик задачи сразу (попытка по умолчанию — первая и не последняя). */
  async run<T extends object>(job: JobDefinition<T>, data: T, attempt: JobAttempt = { last: false }): Promise<void> {
    const registration = this.handlers.get(job.name);
    if (!registration) throw new Error(`Нет обработчика задачи ${job.name}`);
    await registration.handler(data, attempt);
  }

  /** Выполнить всё поставленное по одному разу, по порядку. */
  async drain(): Promise<void> {
    for (const { name, data } of this.sent.splice(0)) await this.run({ name, queue: {} }, data);
  }

  /** Расписания, которые зарегистрировали модули: `[имя, cron]`. */
  scheduled(): [string, string][] {
    return this.schedules.map(({ job, cron }) => [job.name, cron]);
  }
}
