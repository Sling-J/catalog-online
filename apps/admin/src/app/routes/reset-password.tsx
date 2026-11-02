import { createFileRoute } from '@tanstack/react-router';

import { ResetPasswordPage } from '@/pages/reset-password';

// Ссылка из письма «Восстановление пароля»: /reset-password?token=…
export const Route = createFileRoute('/reset-password')({
  validateSearch: (raw: Record<string, unknown>): { token?: string } =>
    typeof raw.token === 'string' && raw.token ? { token: raw.token } : {},
  component: function ResetPasswordRoute() {
    const { token } = Route.useSearch();
    return <ResetPasswordPage token={token} />;
  },
});
