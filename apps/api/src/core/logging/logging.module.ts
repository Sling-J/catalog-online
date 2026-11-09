import { randomUUID } from 'node:crypto';

import { Module } from '@nestjs/common';
import { LoggerModule } from 'nestjs-pino';

import { AppConfig } from '../config/index.js';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Логи в JSON (pino) с id запроса: берём `X-Request-Id` от прокси или создаём свой и возвращаем в ответе.
 * В разработке — читаемый вывод pino-pretty. Cookie и заголовки входа в лог не попадают.
 */
@Module({
  imports: [
    LoggerModule.forRootAsync({
      inject: [AppConfig],
      useFactory: (config: AppConfig) => ({
        pinoHttp: {
          level: config.get('logLevel'),
          ...(config.get('env') === 'development'
            ? { transport: { target: 'pino-pretty', options: { singleLine: true } } }
            : {}),
          genReqId: (req, res) => {
            const incoming = req.headers[REQUEST_ID_HEADER];
            const id = typeof incoming === 'string' && incoming.length <= 128 ? incoming : randomUUID();
            res.setHeader(REQUEST_ID_HEADER, id);
            return id;
          },
          redact: ['req.headers.cookie', 'req.headers.authorization', 'res.headers["set-cookie"]'],
          autoLogging: { ignore: (req) => req.url === '/health' },
        },
      }),
    }),
  ],
})
export class LoggingModule {}
