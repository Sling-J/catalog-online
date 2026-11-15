import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';

import { AppModule } from './app.module.js';
import { loadConfig } from './core/config/index.js';

// Процесс фоновых задач (T-607, scaling.md SC1): тот же код и образ, что у API, но без HTTP — выполняет задачи
// pg-boss (сжатие фото, импорт, уборка) и запускает расписания. API (`main.ts`) задачи только ставит.
const config = { ...loadConfig(), jobsRole: 'work' as const };
const app = await NestFactory.createApplicationContext(AppModule.forRoot(config), { bufferLogs: true });
app.useLogger(app.get(Logger));
// SIGTERM при остановке контейнера: pg-boss дожидается начатых задач (`PgBossJobs.onApplicationShutdown`)
app.enableShutdownHooks();
await app.init();
app.get(Logger).log('Процесс задач запущен', 'Worker');
