import type { I18n } from '@lingui/core';
import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  HeadContent,
  notFound,
  Outlet,
  retainSearchParams,
  Scripts,
  useRouter,
  type ErrorComponentProps,
  type NotFoundRouteProps,
} from '@tanstack/react-router';
import { useEffect, type ReactNode } from 'react';

import { cartMounted } from '@/entities/cart';
import { useShopDraft } from '@/features/shop-draft';
import { ErrorPage } from '@/pages/error';
import { NotFoundPage } from '@/pages/not-found';
import { ShopUnavailablePage } from '@/pages/shop-unavailable';
import { isNotFoundData, isPreviewMode, PREVIEW_PARAM } from '@/shared/api';
import { markAppMounted } from '@/shared/lib';
import { CartSheet } from '@/widgets/cart-sheet';

import { getTenant } from '../lib';
import appCss from '../styles.css?url';

/** Токен превью из админки (A7) — в адресе всех страниц витрины, пока она открыта превью. */
type RootSearch = { [PREVIEW_PARAM]?: string };

export const Route = createRootRouteWithContext<{ queryClient: QueryClient; i18n: I18n }>()({
  validateSearch: (raw: Record<string, unknown>): RootSearch => {
    const token = raw[PREVIEW_PARAM];
    return typeof token === 'string' && token.length > 0 && token.length <= 200 ? { [PREVIEW_PARAM]: token } : {};
  },
  // переходы внутри витрины не теряют токен превью
  search: { middlewares: [retainSearchParams([PREVIEW_PARAM])] },
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { name: 'theme-color', content: '#fbfaff' },
      // превью из админки и чужие адреса поисковикам не показываем
      ...(isPreviewMode() || getTenant().kind === 'unknown' ? [{ name: 'robots', content: 'noindex, nofollow' }] : []),
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),
  beforeLoad: () => {
    const tenant = getTenant();
    // чужой адрес (не основной домен и не поддомен магазина)
    if (tenant.kind === 'unknown') throw notFound();
    return { tenant };
  },
  component: Root,
  notFoundComponent: RootNotFound,
  errorComponent: RootError,
  shellComponent: RootDocument,
});

// Причину «не найдено» кладёт загрузчик маршрута: скрытый магазин, нет товара или просто чужой адрес.
function RootNotFound({ data }: NotFoundRouteProps) {
  if (isNotFoundData(data)) {
    if (data.reason === 'shop_gone') return <ShopUnavailablePage shop={data.shop} />;
    return <NotFoundPage product />;
  }
  return <NotFoundPage />;
}

function RootError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  const tenant = getTenant();
  return (
    <ErrorPage
      subdomain={tenant.kind === 'shop' ? tenant.subdomain : undefined}
      onRetry={() => {
        reset();
        void router.invalidate();
      }}
    />
  );
}

function Root() {
  const { tenant } = Route.useRouteContext();
  const router = useRouter();
  // корзину читаем из хранилища уже после гидратации, чтобы разметка сервера и браузера совпала
  useEffect(() => cartMounted(), []);
  // анимации появления экранов — только при переходах внутри сайта (T-116)
  useEffect(() => router.subscribe('onBeforeNavigate', () => markAppMounted()), [router]);
  return (
    <>
      <Outlet />
      {/* корзина открывается и из каталога, и с карточки товара — поэтому одна на всё приложение */}
      {tenant.kind === 'shop' && <CartSheet subdomain={tenant.subdomain} />}
      {tenant.kind === 'shop' && <ShopDraft subdomain={tenant.subdomain} />}
    </>
  );
}

// правки «О магазине» из админки в превью (T-113)
function ShopDraft({ subdomain }: { subdomain: string }) {
  useShopDraft(subdomain);
  return null;
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
