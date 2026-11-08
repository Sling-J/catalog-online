import { Button, cx } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { CHANGE_PASSWORD_FORM_ID, ChangePasswordForm } from '@/features/change-password';
import { LogoutButton } from '@/features/logout';
import { ResendVerificationLink } from '@/features/resend-verification';
import { meQueryOptions } from '@/entities/session';
import { BackBar } from '@/shared/ui';

/**
 * «Аккаунт» (макет AdminAuth* — «Вход и пароль»; с UX-аудита, U10 — отдельно от магазина, открывается нажатием на
 * карточку магазина): почта для входа и её статус, смена пароля, «Выйти». Телефон — вложенный экран: «Назад» сверху (туда, откуда
 * открыли),
 * «Сохранить пароль» закреплена внизу. Компьютер — заголовок с кнопкой.
 */
export function AccountPage() {
  const { data: me } = useSuspenseQuery(meQueryOptions());
  const verified = me.account.emailVerified;

  return (
    <>
      <BackBar to="/" returnBack>
        <Trans>Аккаунт</Trans>
      </BackBar>
      <div className="hidden lg:block">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-[30px] font-extrabold tracking-[-0.03em]">
            <Trans>Аккаунт</Trans>
          </h1>
          <Button type="submit" form={CHANGE_PASSWORD_FORM_ID} variant="dark" size="compact">
            <Trans>Сохранить пароль</Trans>
          </Button>
        </div>
      </div>

      <div className="px-4 pt-4 lg:mt-[18px] lg:w-[560px] lg:p-0">
        <div className="rounded-[20px] bg-white p-3.5 shadow-[0_1px_0_#eceaf5] lg:rounded-[22px] lg:px-[18px] lg:py-4 lg:shadow-[0_1px_0_#eceaf5,0_6px_16px_rgb(40_30_110/0.05)]">
          <div className="text-[13px] font-semibold text-ink-quiet">
            <Trans>Почта для входа</Trans>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2.5">
            <span className="min-w-0 truncate text-[16px] font-bold">{me.account.email}</span>
            <span
              className={cx(
                'inline-flex h-[26px] flex-none items-center gap-1.5 rounded-pill px-2.5 text-[12px] font-bold whitespace-nowrap',
                verified ? 'bg-mint-soft text-mint-ink' : 'bg-[#fff1d6] text-[#7a4300]',
              )}
            >
              <span className={cx('size-2 rounded-full', verified ? 'bg-stock-in' : 'bg-[#e8a100]')} />
              {verified ? <Trans>подтверждена</Trans> : <Trans>не подтверждена</Trans>}
            </span>
          </div>
          {!verified && (
            <p className="mt-2 text-[13px] leading-[1.5] text-ink-quiet">
              <Trans>Письмо со ссылкой отправлено на эту почту.</Trans> <ResendVerificationLink />
            </p>
          )}
        </div>
        <ChangePasswordForm />
        <LogoutButton className="mt-6 block w-full text-center text-[15px] font-semibold text-coral-underside hover:underline lg:w-auto" />
      </div>

      <div className="fixed inset-x-0 bottom-0 bg-[linear-gradient(rgb(251_250_255/0),var(--color-paper)_30%)] px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] lg:hidden">
        <Button type="submit" form={CHANGE_PASSWORD_FORM_ID} variant="dark" size="form" block>
          <Trans>Сохранить пароль</Trans>
        </Button>
      </div>
    </>
  );
}
