import type { QueueOptions } from 'pg-boss';

import type { DbOrTx } from '../db/index.js';

/**
 * Фоновая задача: имя очереди и её настройки (повторы, сколько ждать). Объявляется константой рядом с модулем
 * (`photos.process`), тип данных — параметр: `defineJob<{ photoId: string }>('photos.process', …)`.
 */
export type JobDefinition<T extends object> = {
  readonly name: string;
  readonly queue: QueueOptions;
  /** Только для вывода типа данных, значения нет. */
  readonly data?: T;
};

export function defineJob<T extends object>(name: string, queue: QueueOptions = {}): JobDefinition<T> {
  return { name, queue };
}

/** Попытка выполнения: `last` — повторов больше не будет (пора записать «не получилось»). */
export type JobAttempt = { last: boolean };

export type JobHandler<T extends object> = (data: T, attempt: JobAttempt) => Promise<void>;

export type JobRegistration = { job: JobDefinition<object>; handler: JobHandler<object> };
export type ScheduleRegistration = { job: JobDefinition<object>; cron: string };

/**
 * Фоновые задачи (backend-structure.md, раздел 9). Модули регистрируют обработчики и расписания в
 * `onModuleInit` (`work`, `schedule`), очередь запускается после — при старте приложения. Внедряется как `Jobs`;
 * в e2e подменяется очередью в памяти (`test/helpers/jobs.ts`).
 */
export abstract class Jobs {
  protected readonly handlers = new Map<string, JobRegistration>();
  protected readonly schedules: ScheduleRegistration[] = [];

  /** Обработчик задачи. Бросил ошибку — задача повторится по настройкам очереди. */
  work<T extends object>(job: JobDefinition<T>, handler: JobHandler<T>): void {
    if (this.handlers.has(job.name)) throw new Error(`Обработчик задачи ${job.name} уже зарегистрирован`);
    this.handlers.set(job.name, { job, handler: handler as JobHandler<object> });
  }

  /** Запускать задачу по расписанию (cron, UTC). Обработчик регистрируется отдельно — `work`. */
  schedule(job: JobDefinition<Record<string, never>>, cron: string): void {
    this.schedules.push({ job, cron });
  }

  /**
   * Поставить задачу. С `tx` — в той же транзакции (раздел 8): откатилась транзакция — задачи нет.
   * Обработчик задачи должен быть зарегистрирован в этом же процессе.
   */
  abstract send<T extends object>(job: JobDefinition<T>, data: T, tx?: DbOrTx): Promise<void>;
}
