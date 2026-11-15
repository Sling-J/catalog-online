import { getMe, startImpersonation } from '@catalog/contract';
import { createFileRoute, redirect } from '@tanstack/react-router';

import { startSession } from '@/entities/session';
import { ImpersonateExpiredPage } from '@/pages/impersonate';
import { statusOf } from '@/shared/api';

// Вход «от имени» из суперадминки (FR-S3, ADR 0005): /impersonate#<токен>. Токен — во фрагменте, на сервер с
// загрузкой страницы он не уходит; обмениваем его на сессию и сразу убираем из адреса.
export const Route = createFileRoute('/impersonate')({
  loader: async ({ context: { queryClient } }) => {
    const token = window.location.hash.slice(1);
    window.history.replaceState(window.history.state, '', window.location.pathname);
    if (!token) return;
    try {
      await startImpersonation({ body: { token }, throwOnError: true });
    } catch (error) {
      if (statusOf(error) === 410) return;
      throw error;
    }
    startSession(queryClient, (await getMe({ throwOnError: true })).data);
    throw redirect({ to: '/', replace: true });
  },
  component: ImpersonateExpiredPage,
});
