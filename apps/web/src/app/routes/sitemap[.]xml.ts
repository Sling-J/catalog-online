import { createFileRoute } from '@tanstack/react-router';

import { configureApi } from '@/shared/api';
import { getSiteOrigin } from '@/shared/lib';

import { getTenant } from '../lib';
import { renderSitemap, shopSitemapUrls } from '../lib/sitemap';

const xml = (body: string) =>
  new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });

// Карта сайта для поисковиков (T-111, NFR-5): у витрины — главная, категории и товары; у лендинга — главная.
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const tenant = getTenant();
        const origin = getSiteOrigin();
        if (tenant.kind === 'landing') return xml(renderSitemap([`${origin}/`]));
        if (tenant.kind !== 'shop') return new Response('Not found', { status: 404 });
        configureApi();
        try {
          return xml(renderSitemap(await shopSitemapUrls(tenant.subdomain, origin)));
        } catch {
          // магазина нет или каталог скрыт — карты нет
          return new Response('Not found', { status: 404 });
        }
      },
    },
  },
});
