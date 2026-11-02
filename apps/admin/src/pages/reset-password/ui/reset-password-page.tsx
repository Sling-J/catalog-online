import { Trans } from '@lingui/react/macro';
import { Link, useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { ResetPasswordForm } from '@/features/reset-password';
import { ButtonLink, FormFooter } from '@/shared/ui';
import { AuthLayout } from '@/widgets/auth-layout';

/** «Новый пароль» по ссылке из письма; ссылки нет или она устарела — «Ссылка устарела» (макет AdminAuth*). */
export function ResetPasswordPage({ token }: { token: string | undefined }) {
  const navigate = useNavigate();
  const [expired, setExpired] = useState(false);

  if (expired || !token) {
    return (
      <AuthLayout
        badge="warn"
        title={<Trans>Ссылка устарела</Trans>}
        subtitle={
          <Trans>
            Ссылки из писем работают ограниченное время и только один раз. Запросите новую — придёт через минуту.
          </Trans>
        }
      >
        <ButtonLink to="/forgot-password" variant="primary" className="mt-6 lg:mt-[26px]">
          <Trans>Прислать новую ссылку</Trans>
        </ButtonLink>
        <FormFooter>
          <Link to="/login" className="font-bold text-iris">
            <Trans>Вернуться ко входу</Trans>
          </Link>
        </FormFooter>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={<Trans>Новый пароль</Trans>}
      subtitle={
        <Trans>Не короче 8 символов. После сохранения выйдем на всех устройствах — войдите с новым паролем.</Trans>
      }
    >
      <ResetPasswordForm
        token={token}
        onDone={() => void navigate({ to: '/login', replace: true })}
        onExpired={() => setExpired(true)}
      />
    </AuthLayout>
  );
}
