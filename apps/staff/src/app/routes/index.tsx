import { staffLogout } from '@catalog/contract';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { useCallback } from 'react';

import { shopsQueryOptions } from '@/entities/shop';
import { staffMeQueryOptions } from '@/entities/staff';
import { ShopsPage } from '@/pages/shops';
import { isUnauthorized } from '@/shared/api';

// Список магазинов (FR-S1). Без сессии сотрудника — на вход.
export const Route = createFileRoute('/')({
  validateSearch: (raw: Record<string, unknown>): { q?: string } =>
    typeof raw.q === 'string' && raw.q.trim() ? { q: raw.q.trim() } : {},
  beforeLoad: async ({ context: { queryClient } }) => {
    try {
      await queryClient.ensureQueryData(staffMeQueryOptions());
    } catch (error) {
      if (isUnauthorized(error)) throw redirect({ to: '/login', replace: true });
      throw error;
    }
  },
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ context: { queryClient }, deps: { q } }) => queryClient.ensureInfiniteQueryData(shopsQueryOptions(q)),
  component: function ShopsRoute() {
    const { q } = Route.useSearch();
    const navigate = Route.useNavigate();
    const { queryClient } = Route.useRouteContext();
    const { data: me } = useSuspenseQuery(staffMeQueryOptions());
    const search = useCallback(
      (next: string) => void navigate({ search: next ? { q: next } : {}, replace: true }),
      [navigate],
    );
    const logout = async () => {
      await staffLogout({ throwOnError: true }).catch(() => {});
      queryClient.clear();
      await navigate({ to: '/login', replace: true });
    };
    return <ShopsPage email={me.email} q={q ?? ''} onSearch={search} onLogout={() => void logout()} />;
  },
});
