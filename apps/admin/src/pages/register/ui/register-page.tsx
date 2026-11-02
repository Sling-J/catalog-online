import type { Me } from '@catalog/contract';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { RegisterForm } from '@/features/register';
import { startSession } from '@/entities/session';
import { AuthLayout } from '@/widgets/auth-layout';

/** Регистрация: после неё сессия уже открыта — сразу в админку (мастер T-303, почту можно подтвердить позже, A9). */
export function RegisterPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const onRegistered = (me: Me) => {
    startSession(queryClient, me);
    void navigate({ to: '/', replace: true });
  };

  return (
    <AuthLayout
      title={<Trans>Создайте каталог магазина</Trans>}
      subtitle={<Trans>Бесплатно на время пилота. Понадобятся почта и номер WhatsApp.</Trans>}
    >
      <RegisterForm onRegistered={onRegistered} />
    </AuthLayout>
  );
}
