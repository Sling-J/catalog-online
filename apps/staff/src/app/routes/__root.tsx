import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { ErrorPage } from '@/pages/error';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  notFoundComponent: () => <ErrorPage title="Такой страницы нет" />,
  errorComponent: ({ reset }) => <ErrorPage title="Не получилось загрузить" onRetry={reset} />,
});
