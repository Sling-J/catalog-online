import { randomUUID } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

import { Global, Injectable, Logger, Module } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

import { AppConfig } from '../config/index.js';

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Отправка писем (backend-structure.md, раздел 3). Внедряется как `Mailer`; в тестах подменяется
 * провайдером, который складывает письма в массив.
 */
export abstract class Mailer {
  abstract send(message: MailMessage): Promise<void>;
}

/** Разработка: письмо — в лог API, ссылку из него можно открыть в браузере. */
@Injectable()
export class LogMailer extends Mailer {
  private readonly logger = new Logger('Mail');

  async send({ to, subject, text }: MailMessage): Promise<void> {
    this.logger.log(`Письмо для ${to} — «${subject}»\n${text}`);
  }
}

/**
 * Разработка и e2e (`MAIL_OUTBOX_DIR`): письмо — файл `<время>-<id>.json` (`to`, `subject`, `text`) в папке, e2e
 * читает из него ссылку (T-502). Имя начинается со времени — по алфавиту файлы идут по порядку отправки.
 */
export class OutboxMailer extends Mailer {
  constructor(private readonly dir: string) {
    super();
  }

  async send(message: MailMessage): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    const name = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomUUID()}.json`;
    await writeFile(join(this.dir, name), JSON.stringify(message, null, 2));
  }
}

/** Продакшен: SMTP из `SMTP_URL` (поставщик — открытый вопрос, open-questions.md). */
export class SmtpMailer extends Mailer {
  private readonly transport: Transporter;

  constructor(
    smtpUrl: string,
    private readonly from: string,
  ) {
    super();
    this.transport = nodemailer.createTransport(smtpUrl);
  }

  async send({ to, subject, text }: MailMessage): Promise<void> {
    await this.transport.sendMail({ from: this.from, to, subject, text });
  }
}

@Global()
@Module({
  providers: [
    {
      provide: Mailer,
      inject: [AppConfig],
      useFactory: (config: AppConfig): Mailer => {
        const smtpUrl = config.get('smtpUrl');
        if (smtpUrl) return new SmtpMailer(smtpUrl, config.get('mailFrom'));
        const outbox = config.get('mailOutboxDir');
        return outbox ? new OutboxMailer(outbox) : new LogMailer();
      },
    },
  ],
  exports: [Mailer],
})
export class MailModule {}
