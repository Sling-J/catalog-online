import { createFileRoute, redirect } from '@tanstack/react-router';

import { meQueryOptions } from '@/entities/session';
import { RegisterPage } from '@/pages/register';

// Регистрация (FR-A1): сюда ведёт «Создать каталог» с лендинга. Уже вошедшего — в админку: один аккаунт — один магазин.
export const Route = createFileRoute('/register')({
  beforeLoad: async ({ context: { queryClient } }) => {
    const me = await queryClient.ensureQueryData(meQueryOptions()).catch(() => null);
    if (me) throw redirect({ to: '/', replace: true });
  },
  component: RegisterPage,
});
