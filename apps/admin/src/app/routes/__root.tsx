import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';

import { ErrorPage } from '@/pages/error';
import { NotFoundPage } from '@/pages/not-found';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: Outlet,
  notFoundComponent: NotFoundPage,
  errorComponent: ({ reset }) => <ErrorPage onRetry={reset} />,
});
