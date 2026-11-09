import { Injectable, Logger } from '@nestjs/common';
import type { Me } from '@catalog/contract';

import { hashToken, newToken, SessionService } from '../../core/auth/index.js';
import { AppConfig } from '../../core/config/index.js';
import { InjectDb, isUniqueViolation, type Db, type DbOrTx } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { Mailer } from '../../core/mail/index.js';
import { toMe } from './auth.mapper.js';
import { authRepository, type TokenPurpose } from './auth.repository.js';
import {
  RESET_PASSWORD_TTL_HOURS,
  resetPasswordMail,
  VERIFY_EMAIL_TTL_HOURS,
  verifyEmailMail,
  type MailContent,
} from './lib/mails.js';
import { hashPassword, normalizeEmail, verifyAgainstDummy, verifyPassword } from './lib/password.js';

const HOUR_MS = 3_600_000;

/**
 * Вход магазина (FR-A1): регистрация, вход и выход, письма подтверждения и сброса, смена пароля.
 * Заблокированный магазин входит — админка показывает ему статус (решение основателя 2026-11-09, T-403).
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger('AuthService');

  constructor(
    @InjectDb() private readonly db: Db,
    private readonly sessions: SessionService,
    private readonly mailer: Mailer,
    private readonly config: AppConfig,
  ) {}

  /** Аккаунт и магазин-черновик, сессия сразу (A9: до подтверждения почты можно всё, кроме публикации). */
  async register(input: { email: string; password: string }): Promise<Me> {
    const email = normalizeEmail(input.email);
    if (await authRepository.findByEmail(this.db, email)) throw new AppError('email_taken', 409);
    const passwordHash = await hashPassword(input.password);

    let accountId: string;
    let token: string;
    try {
      ({ accountId, token } = await this.db.transaction(async (tx) => {
        const created = await authRepository.createShopWithAccount(tx, { email, passwordHash });
        const verifyToken = await this.issueToken(tx, created.accountId, 'verify_email', VERIFY_EMAIL_TTL_HOURS);
        await this.sessions.start(created.accountId, tx);
        return { accountId: created.accountId, token: verifyToken };
      }));
    } catch (error) {
      // одновременная регистрация с той же почтой — уникальный индекс
      if (isUniqueViolation(error)) throw new AppError('email_taken', 409);
      throw error;
    }
    await this.sendSafely(email, verifyEmailMail(this.config.get('adminUrl'), token));
    return this.me(accountId, false);
  }

  async login(input: { email: string; password: string }): Promise<Me> {
    const account = await authRepository.findByEmail(this.db, normalizeEmail(input.email));
    const ok = account
      ? await verifyPassword(account.passwordHash, input.password)
      : await verifyAgainstDummy(input.password);
    if (!account || !ok) throw new AppError('unauthorized', 401);
    await this.sessions.start(account.id);
    return this.me(account.id, false);
  }

  logout(sessionId: string): Promise<void> {
    return this.sessions.end(sessionId);
  }

  async me(accountId: string, impersonated: boolean): Promise<Me> {
    const row = await authRepository.findMe(this.db, accountId);
    if (!row) throw new AppError('unauthorized', 401);
    return toMe(row, impersonated);
  }

  async verifyEmail(token: string): Promise<void> {
    const now = new Date();
    const accountId = await authRepository.useToken(this.db, 'verify_email', hashToken(token), now);
    if (!accountId) throw new AppError('token_expired', 410);
    await authRepository.markEmailVerified(this.db, accountId, now);
  }

  /** Новое письмо подтверждения; прежние ссылки гаснут. Почта уже подтверждена — ничего не делаем. */
  async resendVerificationEmail(accountId: string): Promise<void> {
    const me = await this.me(accountId, false);
    if (me.account.emailVerified) return;
    const token = await this.db.transaction(async (tx) => {
      await authRepository.revokeTokens(tx, accountId, 'verify_email', new Date());
      return this.issueToken(tx, accountId, 'verify_email', VERIFY_EMAIL_TTL_HOURS);
    });
    await this.sendSafely(me.account.email, verifyEmailMail(this.config.get('adminUrl'), token));
  }

  /** Ответ одинаковый, есть такая почта или нет: по нему нельзя проверить, кто зарегистрирован. */
  async forgotPassword(input: { email: string }): Promise<void> {
    const email = normalizeEmail(input.email);
    const account = await authRepository.findByEmail(this.db, email);
    if (!account) return;
    const token = await this.db.transaction(async (tx) => {
      await authRepository.revokeTokens(tx, account.id, 'reset_password', new Date());
      return this.issueToken(tx, account.id, 'reset_password', RESET_PASSWORD_TTL_HOURS);
    });
    await this.sendSafely(email, resetPasswordMail(this.config.get('adminUrl'), token));
  }

  /** Новый пароль по ссылке из письма; все сессии закрываются. */
  async resetPassword(input: { token: string; password: string }): Promise<void> {
    const passwordHash = await hashPassword(input.password);
    await this.db.transaction(async (tx) => {
      const accountId = await authRepository.useToken(tx, 'reset_password', hashToken(input.token), new Date());
      if (!accountId) throw new AppError('token_expired', 410);
      await authRepository.setPassword(tx, accountId, passwordHash);
      await this.sessions.endForAccount(accountId, undefined, tx);
    });
  }

  /** Смена пароля из «Аккаунта»: нужен текущий; остальные сессии закрываются, текущая остаётся. */
  async changePassword(
    session: { accountId: string; sessionId: string },
    input: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    const account = await authRepository.findById(this.db, session.accountId);
    if (!account || !(await verifyPassword(account.passwordHash, input.currentPassword))) {
      throw new AppError('unauthorized', 401);
    }
    const passwordHash = await hashPassword(input.newPassword);
    await this.db.transaction(async (tx) => {
      await authRepository.setPassword(tx, account.id, passwordHash);
      await this.sessions.endForAccount(account.id, session.sessionId, tx);
    });
  }

  private async issueToken(tx: DbOrTx, accountId: string, purpose: TokenPurpose, ttlHours: number): Promise<string> {
    const token = newToken();
    await authRepository.createToken(tx, {
      accountId,
      purpose,
      tokenHash: hashToken(token),
      expiresAt: new Date(Date.now() + ttlHours * HOUR_MS),
    });
    return token;
  }

  /** Письмо не ушло (SMTP недоступен) — регистрация и прочее не падают; ошибка — в лог, письмо можно запросить снова. */
  private async sendSafely(to: string, mail: MailContent): Promise<void> {
    try {
      await this.mailer.send({ to, ...mail });
    } catch (error) {
      this.logger.error(error, `Письмо «${mail.subject}» не отправлено`);
    }
  }
}
