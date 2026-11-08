// Обработчики MSW витрины на данных демо-магазина. Фильтры, пагинацию и поиск упрощаем:
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
import type { Problem, StorefrontShopGone } from '../gen/types.gen.js';
import { createDemoShopData, demoShop, HIDDEN_DEMO_SUBDOMAIN, LOW_STOCK } from './demo-shop.js';
import { computeFacets, readFilters, selectCards } from './filtering.js';

export type DemoHandlersOptions = RequestHandlerOptions & {
  /** Откуда приложение отдаёт фото (`<assetBase>/demo/<имя>.jpg`). Пустая строка — адреса от корня страницы. */
  assetBase?: string;
};

const DEFAULT_PAGE_SIZE = 30;

// Картинки отдаёт само приложение (папка /demo), поэтому по умолчанию база — адрес страницы, а не API.
const dataFor = (request: Request, assetBase?: string) =>
  createDemoShopData(assetBase ?? globalThis.location?.origin ?? new URL(request.url).origin);

const notFound = (): Response =>
  HttpResponse.json<Problem>(
    { type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found' },
    { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
  );

// превью (`?preview=` с любым токеном) открывает и скрытый магазин — как неопубликованную витрину в админке
const isPreview = (request: Request): boolean => new URL(request.url).searchParams.has('preview');

const isDemo = (subdomain: string | readonly string[] | undefined, request: Request): boolean =>
  subdomain === demoShop.subdomain || (subdomain === HIDDEN_DEMO_SUBDOMAIN && isPreview(request));

// Скрытый магазин: 410 с контактами для заглушки (то же лицо, что у демо-магазина)
const gone = (): Response => {
  const { name, logo, address, whatsapp, schedule, timezone } = demoShop;
  return HttpResponse.json<StorefrontShopGone>(
    {
      type: 'about:blank',
      title: 'Gone',
      status: 410,
      code: 'shop_hidden',
      shop: { name, logo, address, whatsapp, schedule, timezone },
    },
    { status: 410, headers: { 'Content-Type': 'application/problem+json' } },
  );
};

export const demoStorefrontHandlers = ({ assetBase, ...options }: DemoHandlersOptions = {}): HttpHandler[] => [
  handleGetStorefrontShop(({ params, request }) => {
    if (!isDemo(params.subdomain, request)) return params.subdomain === HIDDEN_DEMO_SUBDOMAIN ? gone() : notFound();
    return HttpResponse.json({ ...demoShop, subdomain: String(params.subdomain), isPreview: isPreview(request) });
  }, options),
  handleListStorefrontCategories(
    ({ params, request }) =>
      isDemo(params.subdomain, request) ? HttpResponse.json(dataFor(request, assetBase).categories) : notFound(),
    options,
  ),
  handleListStorefrontProducts(({ params, request }) => {
    if (!isDemo(params.subdomain, request)) return notFound();
    const query = new URL(request.url).searchParams;
    const items = selectCards(dataFor(request, assetBase), readFilters(new URL(request.url)));
    // курсор в моках — просто смещение от начала выборки
    const offset = Number(query.get('cursor') ?? 0) || 0;
    const limit = Number(query.get('limit') ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE;
    const next = offset + limit;
    return HttpResponse.json({
      items: items.slice(offset, next),
      nextCursor: next < items.length ? String(next) : null,
    });
  }, options),
  handleGetStorefrontFacets(
    ({ params, request }) =>
      isDemo(params.subdomain, request)
        ? HttpResponse.json(computeFacets(dataFor(request, assetBase), readFilters(new URL(request.url))))
        : notFound(),
    options,
  ),
  handleGetStorefrontProduct(({ params, request }) => {
    const product = dataFor(request, assetBase).products.find((entry) => entry.shortId === params.shortId);
    return isDemo(params.subdomain, request) && product ? HttpResponse.json(product) : notFound();
  }, options),
  handleCheckStorefrontCart(async ({ request }) => {
    const { items } = await request.json();
    const { products } = dataFor(request, assetBase);
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
          product: null,
        };
      }
      const outOfStock = variant.stock.level === 'out';
      // у «мало» остаток не больше LOW_STOCK: так в моках видно «количество уменьшено»
      const quantity = outOfStock
        ? 0
        : variant.stock.level === 'low'
          ? Math.min(item.quantity, LOW_STOCK)
          : item.quantity;
      total += quantity * variant.price;
      return {
        variantId: item.variantId,
        status: outOfStock ? ('out_of_stock' as const) : ('ok' as const),
        quantity,
        price: variant.price,
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
