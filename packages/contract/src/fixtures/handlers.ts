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
import type { Problem } from '../gen/types.gen.js';
import { createDemoShopData, demoShop } from './demo-shop.js';

export type DemoHandlersOptions = RequestHandlerOptions & {
  /** Откуда приложение отдаёт фото (`<assetBase>/demo/<имя>.jpg`). Пустая строка — адреса от корня страницы. */
  assetBase?: string;
};

const DEFAULT_PAGE_SIZE = 30;

// Картинки отдаёт само приложение (папка /demo), поэтому по умолчанию база — адрес страницы, а не API.
const dataFor = (request: Request, assetBase?: string) =>
  createDemoShopData(assetBase ?? globalThis.location?.origin ?? new URL(request.url).origin);

/** Карточки по фильтрам запроса: категория, поиск, сортировка (демо-магазин плоский, без подкатегорий). */
const filterCards = (request: Request, assetBase?: string) => {
  const { cards, products } = dataFor(request, assetBase);
  const params = new URL(request.url).searchParams;
  const categoryId = params.get('categoryId');
  const query = params.get('q')?.toLowerCase();
  const sort = params.get('sort');
  const items = cards.filter((card) => {
    const product = products.find((entry) => entry.id === card.id);
    if (categoryId && product?.category?.id !== categoryId) return false;
    return !query || card.name.toLowerCase().includes(query);
  });
  if (sort === 'price_asc') items.sort((a, b) => a.price - b.price);
  if (sort === 'price_desc') items.sort((a, b) => b.price - a.price);
  return items;
};

const notFound = (): Response =>
  HttpResponse.json<Problem>(
    { type: 'about:blank', title: 'Not Found', status: 404, code: 'not_found' },
    { status: 404, headers: { 'Content-Type': 'application/problem+json' } },
  );

const isDemo = (subdomain: string | readonly string[] | undefined): boolean => subdomain === demoShop.subdomain;

export const demoStorefrontHandlers = ({ assetBase, ...options }: DemoHandlersOptions = {}): HttpHandler[] => [
  handleGetStorefrontShop(
    ({ params }) => (isDemo(params.subdomain) ? HttpResponse.json(demoShop) : notFound()),
    options,
  ),
  handleListStorefrontCategories(
    ({ params, request }) =>
      isDemo(params.subdomain) ? HttpResponse.json(dataFor(request, assetBase).categories) : notFound(),
    options,
  ),
  handleListStorefrontProducts(({ params, request }) => {
    if (!isDemo(params.subdomain)) return notFound();
    const query = new URL(request.url).searchParams;
    const items = filterCards(request, assetBase);
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
      isDemo(params.subdomain)
        ? HttpResponse.json({ ...dataFor(request, assetBase).facets, total: filterCards(request, assetBase).length })
        : notFound(),
    options,
  ),
  handleGetStorefrontProduct(({ params, request }) => {
    const product = dataFor(request, assetBase).products.find((entry) => entry.shortId === params.shortId);
    return isDemo(params.subdomain) && product ? HttpResponse.json(product) : notFound();
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
