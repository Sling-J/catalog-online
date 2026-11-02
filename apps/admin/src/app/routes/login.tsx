import { createFileRoute, redirect } from '@tanstack/react-router';

import { meQueryOptions } from '@/entities/session';
import { LoginPage } from '@/pages/login';

// Вход (FR-A1). Уже вошедшего — сразу в админку.
export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const me = await queryClient.ensureQueryData(meQueryOptions()).catch(() => null);
    if (me) throw redirect({ to: '/', replace: true });
  },
  component: LoginPage,
});
