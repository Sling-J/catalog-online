import type { QueryClient } from '@tanstack/react-query';
import { createRootRouteWithContext, HeadContent, notFound, Outlet, Scripts } from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';

import { cartMounted } from '@/entities/cart';
import { NotFoundPage } from '@/pages/not-found';
import { CartSheet } from '@/widgets/cart-sheet';

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
  component: Root,
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function Root() {
  const { tenant } = Route.useRouteContext();
  // корзину читаем из хранилища уже после гидратации, чтобы разметка сервера и браузера совпала
  useEffect(() => {
    cartMounted();
  }, []);
  return (
    <>
      <Outlet />
      {/* корзина открывается и из каталога, и с карточки товара — поэтому одна на всё приложение */}
      {tenant.kind === 'shop' && <CartSheet subdomain={tenant.subdomain} />}
    </>
  );
}

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
