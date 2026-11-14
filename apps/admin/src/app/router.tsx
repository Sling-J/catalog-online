import { retryQuery } from '@catalog/contract/query';
import { I18nProvider } from '@lingui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';

import { configureApi } from '@/shared/api';

import { createI18n } from './i18n';
import { routeTree } from './routeTree.gen';

export function createAppRouter() {
  configureApi();
  const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000, retry: retryQuery } } });
  const i18n = createI18n();
  return createRouter({
    routeTree,
    context: { queryClient },
    Wrap: ({ children }) => (
      <I18nProvider i18n={i18n}>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </I18nProvider>
    ),
    defaultPreload: 'intent',
    // наведение дольше 250 мс: при прокрутке колесом плитки проезжают под курсором — с умолчанием 50 мс каждая
    // такая загружалась зря (e2e T-502: три карточки за одну прокрутку)
    defaultPreloadDelay: 250,
    // свежесть данных решает Query, роутер только вызывает загрузчики
    defaultPreloadStaleTime: 0,
    scrollRestoration: true,
  });
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>;
  }
  interface StaticDataRouteOption {
    /** Вложенный экран раздела: на телефоне без шапки магазина и нижнего меню, своя «Назад» (макеты админки). */
    subScreen?: boolean;
  }
}
