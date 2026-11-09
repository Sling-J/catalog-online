import type {
  ChangePasswordData,
  ForgotPasswordData,
  LoginData,
  Me,
  RegisterData,
  ResetPasswordData,
  VerifyEmailData,
} from '@catalog/contract';
import type { AuthControllerMethods } from '@catalog/contract/nest';
import {
  zChangePasswordBody,
  zForgotPasswordBody,
  zLoginBody,
  zRegisterBody,
  zResetPasswordBody,
  zVerifyEmailBody,
} from '@catalog/contract/zod';
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';

import { Authenticated } from '../../core/auth/index.js';
import { RequestContext } from '../../core/context/index.js';
import { RateLimit } from '../../core/rate-limit/index.js';
import { AuthService } from './auth.service.js';

const MINUTE = 60_000;

/** `/v1/auth/*` (контракт, тег auth). Ограничения частоты — api.md: вход, регистрация, письма. */
@Controller('v1/auth')
export class AuthController implements AuthControllerMethods {
  constructor(
    private readonly auth: AuthService,
    private readonly ctx: RequestContext,
  ) {}

  @Post('register')
  @RateLimit(10, 60 * MINUTE)
  register(@Body({ schema: zRegisterBody }) body: RegisterData['body']): Promise<Me> {
    return this.auth.register(body);
  }

  @Post('login')
  @HttpCode(200)
  @RateLimit(10, MINUTE)
  login(@Body({ schema: zLoginBody }) body: LoginData['body']): Promise<Me> {
    return this.auth.login(body);
  }

  @Post('logout')
  @HttpCode(204)
  @Authenticated()
  logout(): Promise<void> {
    return this.auth.logout(this.ctx.session().sessionId);
  }

  @Get('me')
  @Authenticated()
  getMe(): Promise<Me> {
    const session = this.ctx.session();
    return this.auth.me(session.accountId, session.impersonated);
  }

  @Post('email/verify')
  @HttpCode(204)
  @RateLimit(20, 15 * MINUTE)
  verifyEmail(@Body({ schema: zVerifyEmailBody }) body: VerifyEmailData['body']): Promise<void> {
    return this.auth.verifyEmail(body.token);
  }

  @Post('email/resend')
  @HttpCode(204)
  @Authenticated()
  @RateLimit(3, 15 * MINUTE)
  resendVerificationEmail(): Promise<void> {
    return this.auth.resendVerificationEmail(this.ctx.accountId());
  }

  @Post('password/forgot')
  @HttpCode(204)
  @RateLimit(5, 15 * MINUTE)
  forgotPassword(@Body({ schema: zForgotPasswordBody }) body: ForgotPasswordData['body']): Promise<void> {
    return this.auth.forgotPassword(body);
  }

  @Post('password/reset')
  @HttpCode(204)
  @RateLimit(10, 15 * MINUTE)
  resetPassword(@Body({ schema: zResetPasswordBody }) body: ResetPasswordData['body']): Promise<void> {
    return this.auth.resetPassword(body);
  }

  @Post('password/change')
  @HttpCode(204)
  @Authenticated()
  @RateLimit(10, 15 * MINUTE)
  changePassword(@Body({ schema: zChangePasswordBody }) body: ChangePasswordData['body']): Promise<void> {
    return this.auth.changePassword(this.ctx.session(), body);
  }
}
