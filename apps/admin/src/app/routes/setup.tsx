import { createFileRoute, redirect } from '@tanstack/react-router';

import { meQueryOptions } from '@/entities/session';
import { shopQueryOptions } from '@/entities/shop';
import { SetupPage } from '@/pages/setup';
import { isUnauthorized } from '@/shared/api';

// Мастер настройки (FR-A2): после регистрации, пока не пройден. Без сессии — на вход, пройден — в админку.
export const Route = createFileRoute('/setup')({
  validateSearch: (raw: Record<string, unknown>): { step?: number } => {
    const step = Number(raw.step);
    return Number.isInteger(step) && step >= 1 && step <= 4 ? { step } : {};
  },
  beforeLoad: async ({ context: { queryClient } }) => {
    try {
      const me = await queryClient.ensureQueryData(meQueryOptions());
      if (me.shop.setupCompleted) throw redirect({ to: '/', replace: true });
    } catch (error) {
      if (isUnauthorized(error)) throw redirect({ to: '/login', replace: true });
      throw error;
    }
  },
  loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(shopQueryOptions()),
  component: function SetupRoute() {
    const { step } = Route.useSearch();
    return <SetupPage requestedStep={step} />;
  },
});
