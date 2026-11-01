// Обработчики MSW витрины на данных демо-магазина. Пагинацию и поиск упрощаем:
// задача моков — дать фронту реалистичные ответы, а не повторить логику API.
import { HttpResponse, type HttpHandler } from 'msw';

import {
  handleCheckStorefrontCart,
  handleGetStorefrontFacets,
  handleGetStorefrontProduct,
  handleGetStorefrontShop,
  handleListStorefrontCategories,
  handleListStorefrontProducts,
  handleTrackStorefrontEvent,
  type RequestHandlerOptions,
} from '../gen/msw.gen.js';
import type { Problem } from '../gen/types.gen.js';
import { createDemoShopData, demoShop } from './demo-shop.js';

// Картинки отдаёт само приложение (папка /demo), поэтому база — адрес страницы, а не API.
const dataFor = (request: Request) => createDemoShopData(globalThis.location?.origin ?? new URL(request.url).origin);

const notFound = (): Response =>
  HttpResponse.json<Problem>(
    { type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found' },
    { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
  );

const isDemo = (subdomain: string | readonly string[] | undefined): boolean => subdomain === demoShop.subdomain;

export const demoStorefrontHandlers = (options?: RequestHandlerOptions): HttpHandler[] => [
  handleGetStorefrontShop(
    ({ params }) => (isDemo(params.subdomain) ? HttpResponse.json(demoShop) : notFound()),
    options,
  ),
  handleListStorefrontCategories(
    ({ params, request }) => (isDemo(params.subdomain) ? HttpResponse.json(dataFor(request).categories) : notFound()),
    options,
  ),
  handleListStorefrontProducts(({ params, request }) => {
    if (!isDemo(params.subdomain)) return notFound();
    const { cards, products } = dataFor(request);
    const url = new URL(request.url);
    const categoryId = url.searchParams.get('categoryId');
    const query = url.searchParams.get('q')?.toLowerCase();
    const items = cards.filter((card) => {
      const product = products.find((entry) => entry.id === card.id);
      if (categoryId && product?.category?.id !== categoryId) return false;
      return !query || card.name.toLowerCase().includes(query);
    });
    return HttpResponse.json({ items, nextCursor: null });
  }, options),
  handleGetStorefrontFacets(
    ({ params, request }) => (isDemo(params.subdomain) ? HttpResponse.json(dataFor(request).facets) : notFound()),
    options,
  ),
  handleGetStorefrontProduct(({ params, request }) => {
    const product = dataFor(request).products.find((entry) => entry.shortId === params.shortId);
    return isDemo(params.subdomain) && product ? HttpResponse.json(product) : notFound();
  }, options),
  handleCheckStorefrontCart(async ({ request }) => {
    const { items } = await request.json();
    const { products } = dataFor(request);
    let total = 0;
    const checked = items.map((item) => {
      const product = products.find((entry) => entry.variants.some((variant) => variant.id === item.variantId));
      const variant = product?.variants.find((entry) => entry.id === item.variantId);
      if (!product || !variant) {
        return {
          variantId: item.variantId,
          status: 'unavailable' as const,
          quantity: 0,
          price: null,
          previousPrice: null,
          product: null,
        };
      }
      const outOfStock = variant.stock.level === 'out';
      const quantity = outOfStock ? 0 : item.quantity;
      total += quantity * variant.price;
      return {
        variantId: item.variantId,
        status: outOfStock ? ('out_of_stock' as const) : ('ok' as const),
        quantity,
        price: variant.price,
        previousPrice: null,
        product: {
          shortId: product.shortId,
          slug: product.slug,
          name: product.name,
          variantLabel: product.attributes.length
            ? `${product.attributes[0]?.name} ${product.attributes[0]?.values.find((value) => variant.valueIds.includes(value.id))?.value ?? ''}`.trim()
            : 'Один размер',
          cover: product.photos[0] ?? null,
        },
      };
    });
    return HttpResponse.json({ items: checked, total });
  }, options),
  handleTrackStorefrontEvent(() => new HttpResponse(null, { status: 204 }), options),
];
