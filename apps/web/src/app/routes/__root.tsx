import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, notFound, Outlet, Scripts } from '@tanstack/react-router';
import type { ReactNode } from 'react';

import { NotFoundPage } from '@/pages/not-found';

import { getTenant } from '../lib';
import appCss from '../styles.css?url';

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [{ charSet: 'utf-8' }, { name: 'viewport', content: 'width=device-width, initial-scale=1' }],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  beforeLoad: () => {
    const tenant = getTenant();
    // чужой адрес (не основной домен и не поддомен магазина)
    if (tenant.kind === 'unknown') throw notFound();
    return { tenant };
  },
  component: Outlet,
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}
