import { Injectable, Logger, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { sql } from 'drizzle-orm';
import { fromDrizzle, PgBoss } from 'pg-boss';

import { AppConfig } from '../config/index.js';
import type { DbOrTx } from '../db/index.js';
import { Jobs, type JobDefinition, type JobRegistration } from './jobs.js';

/** Таблицы pg-boss — в своей схеме той же базы; создаёт и обновляет их сам pg-boss, не наши миграции. */
export const JOBS_SCHEMA = 'pgboss';

/**
 * Очередь pg-boss (ADR 0001, раздел 9). Обработчики регистрируют оба процесса, а выполняет задачи и запускает
 * расписания только процесс задач (`worker.ts`, роль `work`); API (роль `enqueue`) задачи только ставит (T-607, SC1).
 * Очереди создают оба — так API может ставить задачи, даже если процесс задач ещё не стартовал. Своё небольшое
 * подключение `pg`: так устроен pg-boss; задачи из транзакции ставятся через подключение Drizzle (`fromDrizzle`).
 */
@Injectable()
export class PgBossJobs extends Jobs implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger('Jobs');
  private boss: PgBoss | null = null;

  constructor(private readonly config: AppConfig) {
    super();
  }

  async onApplicationBootstrap(): Promise<void> {
    const working = this.config.get('jobsRole') === 'work';
    const boss = new PgBoss({
      connectionString: this.config.get('databaseUrl'),
      schema: JOBS_SCHEMA,
      max: working ? 4 : 2,
      application_name: working ? 'catalog-worker' : 'catalog-api-jobs',
      // API задачи не выполняет: без опроса расписаний и обслуживания очереди — это дело процесса задач
      schedule: working,
      supervise: working,
    });
    boss.on('error', (error) => this.logger.error(error));
    await boss.start();
    for (const registration of this.handlers.values()) {
      await this.ensureQueue(boss, registration.job);
      if (working) await this.startWorker(boss, registration);
    }
    if (working) {
      for (const { job, cron } of this.schedules) {
        await this.ensureQueue(boss, job);
        await boss.schedule(job.name, cron);
      }
    }
    this.boss = boss;
  }

  async onApplicationShutdown(): Promise<void> {
    // ждём начатые задачи, потом закрываем подключение
    await this.boss?.stop({ timeout: 10_000 });
    this.boss = null;
  }

  async send<T extends object>(job: JobDefinition<T>, data: T, tx?: DbOrTx): Promise<void> {
    if (!this.boss) throw new Error(`Очередь не запущена — задача ${job.name} не поставлена`);
    if (!this.handlers.has(job.name)) throw new Error(`Нет обработчика задачи ${job.name}`);
    await this.boss.send(job.name, data, tx ? { db: fromDrizzle(tx, sql) } : {});
  }

  private async startWorker(boss: PgBoss, { job, handler }: JobRegistration): Promise<void> {
    await boss.work<object, void, { includeMetadata: true }>(job.name, { includeMetadata: true }, async ([item]) => {
      if (!item) return;
      const last = item.retryCount >= item.retryLimit;
      try {
        await handler(item.data, { last });
      } catch (error) {
        this.logger.error({ err: error, job: job.name, jobId: item.id, retryCount: item.retryCount, last });
        throw error;
      }
    });
  }

  /** Очередь с настройками из объявления задачи; поменялись настройки — обновляем. */
  private async ensureQueue(boss: PgBoss, job: JobDefinition<object>): Promise<void> {
    if (await boss.getQueue(job.name)) await boss.updateQueue(job.name, job.queue);
    else await boss.createQueue(job.name, job.queue);
  }
}
