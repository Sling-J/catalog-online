import { Injectable, Logger } from '@nestjs/common';
import type { Me } from '@catalog/contract';

import { AppConfig } from '../../core/config/index.js';
import { InjectDb, isUniqueViolation, type Db, type DbOrTx } from '../../core/db/index.js';
import { AppError } from '../../core/errors/index.js';
import { Jobs, type JobAttempt } from '../../core/jobs/index.js';
import { Mailer } from '../../core/mail/index.js';
import { toMe } from './auth.mapper.js';
import { authRepository, type TokenPurpose } from './auth.repository.js';
import { AUTH_MAIL } from './lib/auth-mail-job.js';
import { RESET_PASSWORD_TTL_HOURS, resetPasswordMail, VERIFY_EMAIL_TTL_HOURS, verifyEmailMail } from './lib/mails.js';
import {
  hashPassword,
  hashToken,
  newToken,
  normalizeEmail,
  SessionService,
  verifyAgainstDummy,
  verifyPassword,
} from '../../core/auth/index.js';

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
    private readonly jobs: Jobs,
    private readonly config: AppConfig,
  ) {}

  /** Аккаунт и магазин-черновик, сессия сразу (A9: до подтверждения почты можно всё, кроме публикации). */
  async register(input: { email: string; password: string }): Promise<Me> {
    const email = normalizeEmail(input.email);
    if (await authRepository.findByEmail(this.db, email)) throw new AppError('email_taken', 409);
    const passwordHash = await hashPassword(input.password);

    let accountId: string;
    try {
      accountId = await this.db.transaction(async (tx) => {
        const created = await authRepository.createShopWithAccount(tx, { email, passwordHash });
        await this.sessions.start(created.accountId, tx);
        await this.jobs.send(AUTH_MAIL, { accountId: created.accountId, purpose: 'verify_email' }, tx);
        return created.accountId;
      });
    } catch (error) {
      // одновременная регистрация с той же почтой — уникальный индекс
      if (isUniqueViolation(error)) throw new AppError('email_taken', 409);
      throw error;
    }
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

  /** Вход «от имени» по ссылке из суперадминки (FR-S3, ADR 0005): токен гаснет, cookie `sid` с отметкой сотрудника. */
  async startImpersonation(token: string): Promise<void> {
    await this.db.transaction(async (tx) => {
      const used = await authRepository.useImpersonationToken(tx, hashToken(token), new Date());
      if (!used) throw new AppError('token_expired', 410);
      await this.sessions.startImpersonated(used.accountId, used.staffUserId, tx);
    });
  }

  /**
   * Новое письмо подтверждения (прежние ссылки гаснут при его отправке). Почта уже подтверждена — ничего не делаем. Во входе
   * сотрудника «от имени» — 403: письма владельцу шлёт только он сам (решение основателя 2026-11-10, T-412).
   */
  async resendVerificationEmail(session: { accountId: string; impersonated: boolean }): Promise<void> {
    if (session.impersonated) throw new AppError('forbidden', 403);
    const { accountId } = session;
    const me = await this.me(accountId, false);
    if (me.account.emailVerified) return;
    await this.jobs.send(AUTH_MAIL, { accountId, purpose: 'verify_email' });
  }

  /** Ответ одинаковый, есть такая почта или нет: по нему нельзя проверить, кто зарегистрирован. */
  async forgotPassword(input: { email: string }): Promise<void> {
    const email = normalizeEmail(input.email);
    const account = await authRepository.findByEmail(this.db, email);
    if (!account) return;
    await this.jobs.send(AUTH_MAIL, { accountId: account.id, purpose: 'reset_password' });
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

  /**
   * Смена пароля из «Аккаунта»: нужен текущий; остальные сессии закрываются, текущая остаётся. Во входе сотрудника
   * «от имени» — 403 (решение основателя 2026-11-10, T-412).
   */
  async changePassword(
    session: { accountId: string; sessionId: string; impersonated: boolean },
    input: { currentPassword: string; newPassword: string },
  ): Promise<void> {
    if (session.impersonated) throw new AppError('forbidden', 403);
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

  /**
   * Задача `auth.mail` (процесс задач): прежние ссылки того же назначения гаснут, выпускается новая, письмо уходит
   * на текущую почту аккаунта. Подтверждение уже не нужно или аккаунта нет — ничего не делаем. SMTP не ответил —
   * ошибка, задача повторится (на повторе ссылка снова новая: письмо с прежней не дошло).
   */
  async sendAuthMail(job: { accountId: string; purpose: TokenPurpose }, attempt: JobAttempt): Promise<void> {
    const me = await authRepository.findMe(this.db, job.accountId);
    if (!me || (job.purpose === 'verify_email' && me.emailVerifiedAt)) return;
    const ttlHours = job.purpose === 'verify_email' ? VERIFY_EMAIL_TTL_HOURS : RESET_PASSWORD_TTL_HOURS;
    const token = await this.db.transaction(async (tx) => {
      await authRepository.revokeTokens(tx, job.accountId, job.purpose, new Date());
      return this.issueToken(tx, job.accountId, job.purpose, ttlHours);
    });
    const adminUrl = this.config.get('adminUrl');
    const mail = job.purpose === 'verify_email' ? verifyEmailMail(adminUrl, token) : resetPasswordMail(adminUrl, token);
    try {
      await this.mailer.send({ to: me.email, ...mail });
    } catch (error) {
      if (attempt.last) this.logger.error(error, `Письмо «${mail.subject}» не отправлено, попытки кончились`);
      throw error;
    }
  }
}
