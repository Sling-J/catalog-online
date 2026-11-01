import { I18nProvider } from '@lingui/react';
import { QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

import { configureApi } from '@/shared/api';

import { createI18n } from './i18n';
import { routeTree } from './routeTree.gen';

// Router и QueryClient создаются на каждый запрос: кеш сервера не попадает к другому покупателю.
export function getRouter() {
  configureApi();
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });
  const i18n = createI18n();
  const router = createRouter({
    routeTree,
    context: { queryClient },
    Wrap: ({ children }) => <I18nProvider i18n={i18n}>{children}</I18nProvider>,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  return router;
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
