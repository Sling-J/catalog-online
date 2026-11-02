import type { Me } from '@catalog/contract';
import { Trans } from '@lingui/react/macro';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import { LoginForm } from '@/features/login';
import { startSession } from '@/entities/session';
import { AuthLayout } from '@/widgets/auth-layout';

/** Вход в админку (макет AdminAuth*, экран 1). */
export function LoginPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const onLoggedIn = (me: Me) => {
    startSession(queryClient, me);
    void navigate({ to: '/', replace: true });
  };

  return (
    <AuthLayout
      title={<Trans>Вход в каталог</Trans>}
      subtitle={<Trans>Почта и пароль, которые вы указали при регистрации.</Trans>}
    >
      <LoginForm onLoggedIn={onLoggedIn} />
    </AuthLayout>
  );
}
