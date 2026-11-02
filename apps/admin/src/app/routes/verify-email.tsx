import { verifyEmail } from '@catalog/contract';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { meQueryOptions } from '@/entities/session';
import { VerifyEmailPage, type VerifyEmailResult } from '@/pages/verify-email';
import { statusOf } from '@/shared/api';

// Ссылка из письма «Подтвердите почту»: /verify-email?token=… Проверяем в загрузчике, страница показывает итог.
export const Route = createFileRoute('/verify-email')({
  validateSearch: (raw: Record<string, unknown>): { token?: string } =>
    typeof raw.token === 'string' && raw.token ? { token: raw.token } : {},
  loaderDeps: ({ search }) => ({ token: search.token }),
  loader: async ({ deps: { token }, context: { queryClient } }): Promise<VerifyEmailResult> => {
    if (token) {
      try {
        await verifyEmail({ body: { token }, throwOnError: true });
        // в кеше — уже подтверждённая почта
        await queryClient.invalidateQueries({ queryKey: meQueryOptions().queryKey });
        return { verified: true };
      } catch (error) {
        if (statusOf(error) !== 410) throw error;
      }
    }
    // ссылка устарела: новое письмо можно отправить только вошедшему
    const me = await queryClient.ensureQueryData(meQueryOptions()).catch(() => null);
    if (!me) throw redirect({ to: '/login', replace: true });
    return { verified: false, email: me.account.email };
  },
  component: function VerifyEmailRoute() {
    return <VerifyEmailPage result={Route.useLoaderData()} />;
  },
});
