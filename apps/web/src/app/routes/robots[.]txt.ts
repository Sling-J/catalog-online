import { createFileRoute } from '@tanstack/react-router';

import { getSiteOrigin } from '@/shared/lib';

import { getTenant } from '../lib';

const text = (body: string) =>
  new Response(body, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  });

// Витрины и лендинг открыты поисковикам и ведут к карте сайта (T-111); чужие адреса закрыты.
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: () => {
        if (getTenant().kind === 'unknown') return text('User-agent: *\nDisallow: /\n');
        return text(`User-agent: *\nAllow: /\n\nSitemap: ${getSiteOrigin()}/sitemap.xml\n`);
      },
    },
  },
});
