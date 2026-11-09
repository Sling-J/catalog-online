// Тексты писем входа. Простой текст по-русски; оформление — позже. Ссылки ведут в админку
// (api.md, «Ссылки из писем»): /verify-email?token=… и /reset-password?token=….

export type MailContent = { subject: string; text: string };

export const VERIFY_EMAIL_TTL_HOURS = 48;
export const RESET_PASSWORD_TTL_HOURS = 1;

export function verifyEmailMail(adminUrl: string, token: string): MailContent {
  return {
    subject: 'Подтвердите почту',
    text: [
      'Здравствуйте!',
      '',
      'Чтобы подтвердить почту и открыть публикацию витрины, перейдите по ссылке:',
      `${adminUrl}/verify-email?token=${encodeURIComponent(token)}`,
      '',
      `Ссылка действует ${VERIFY_EMAIL_TTL_HOURS} часов. Если вы не регистрировались — просто удалите письмо.`,
    ].join('\n'),
  };
}

export function resetPasswordMail(adminUrl: string, token: string): MailContent {
  return {
    subject: 'Новый пароль',
    text: [
      'Здравствуйте!',
      '',
      'Чтобы задать новый пароль, перейдите по ссылке:',
      `${adminUrl}/reset-password?token=${encodeURIComponent(token)}`,
      '',
      'Ссылка действует 1 час. Если вы не просили сменить пароль — просто удалите письмо, пароль останется прежним.',
    ].join('\n'),
  };
}
