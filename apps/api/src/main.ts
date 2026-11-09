import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import { loadConfig } from './core/config/index.js';
import { configureApp } from './core/http/index.js';

const config = loadConfig();
const app = await NestFactory.create<NestExpressApplication>(AppModule.forRoot(config), { bufferLogs: true });
configureApp(app, config);
await app.listen(config.port);
