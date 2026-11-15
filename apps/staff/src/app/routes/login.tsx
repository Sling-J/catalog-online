import { createFileRoute, redirect, useRouter } from '@tanstack/react-router';

import { staffMeQueryOptions } from '@/entities/staff';
import { LoginPage } from '@/pages/login';

// Вход сотрудника. Уже вошёл — сразу к списку магазинов. Если сюда отправил список (сессии нет — запрос уже ответил
// ошибкой), второй раз не спрашиваем.
export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const options = staffMeQueryOptions();
    if (queryClient.getQueryState(options.queryKey)?.status === 'error') return;
    const me = await queryClient.ensureQueryData(options).catch(() => null);
    if (me) throw redirect({ to: '/', replace: true });
  },
  component: function LoginRoute() {
    const router = useRouter();
    const { queryClient } = Route.useRouteContext();
    return (
      <LoginPage
        onSuccess={async () => {
          queryClient.clear();
          await router.navigate({ to: '/', replace: true });
        }}
      />
    );
  },
});
