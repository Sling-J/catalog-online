import { forgotPasswordMutation } from '@catalog/contract/query';
import { Trans } from '@lingui/react/macro';
import { useMutation } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';

import { ForgotPasswordForm } from '@/features/forgot-password';
import { FormFooter, SendAgain } from '@/shared/ui';
import { AuthLayout } from '@/widgets/auth-layout';

/** «Восстановление пароля» → «Проверьте почту» с «Отправить ещё раз» (макет AdminAuth*, экраны 4–5). */
export function ForgotPasswordPage() {
  const [sentTo, setSentTo] = useState<string | null>(null);
  const forgot = useMutation(forgotPasswordMutation());

  if (!sentTo) {
    return (
      <AuthLayout
        title={<Trans>Восстановление пароля</Trans>}
        subtitle={<Trans>Пришлём на почту ссылку, по которой можно задать новый пароль.</Trans>}
      >
        <ForgotPasswordForm onSent={setSentTo} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      badge="mail"
      title={<Trans>Проверьте почту</Trans>}
      subtitle={
        <Trans>
          Если каталог с почтой <b>{sentTo}</b> есть, мы прислали ссылку для нового пароля. Письмо может попасть в
          «Спам».
        </Trans>
      }
    >
      <SendAgain
        variant="soft"
        coolingFromStart
        pending={forgot.isPending}
        onSend={() =>
          forgot
            .mutateAsync({ body: { email: sentTo } })
            .then(() => true)
            .catch(() => false)
        }
      >
        <Trans>Отправить ещё раз</Trans>
      </SendAgain>
      <FormFooter>
        <Link to="/login" className="font-bold text-iris">
          <Trans>Вернуться ко входу</Trans>
        </Link>
      </FormFooter>
    </AuthLayout>
  );
}
