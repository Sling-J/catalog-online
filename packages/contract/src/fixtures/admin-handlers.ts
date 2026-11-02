// Обработчики MSW админки на данных демо-магазина: владелец «Айгерим Kids» уже вошёл и прошёл мастер.
// Вход и регистрация (T-302) и остальные разделы добавляются вместе со своими экранами.
import { HttpResponse, type HttpHandler } from 'msw';

import { handleGetMe, handleGetProductCounts, handleGetShop, type RequestHandlerOptions } from '../gen/msw.gen.js';
import type { Me, Shop } from '../gen/types.gen.js';
import { createDemoShopData, demoShop } from './demo-shop.js';

const SHOP_ID = '0192d000-0000-7000-8000-00000000a001';

const { products } = createDemoShopData();

const counts = {
  all: products.length,
  noPhoto: products.filter((product) => product.photos.length === 0).length,
  outOfStock: products.filter((product) => product.variants.every((variant) => variant.stock.level === 'out')).length,
  hidden: 0,
};

export const demoMe: Me = {
  account: {
    id: '0192d000-0000-7000-8000-00000000b001',
    email: 'aigerim.kids@example.com',
    emailVerified: true,
    impersonated: false,
  },
  shop: { id: SHOP_ID, name: demoShop.name, subdomain: demoShop.subdomain, status: 'published', setupCompleted: true },
};

const {
  subdomain,
  name,
  logo,
  description,
  whatsapp,
  instagram,
  address,
  howToFind,
  schedule,
  timezone,
  stockDisplay,
} = demoShop;

export const demoAdminShop: Shop = {
  id: SHOP_ID,
  status: 'published',
  subdomain,
  name,
  logo,
  description,
  whatsapp,
  instagram,
  address,
  howToFind,
  schedule,
  timezone,
  stockDisplay,
  lowStockThreshold: 2,
  showOutOfStock: true,
  publishedAt: '2026-10-20T09:00:00Z',
  readiness: {
    settingsFilled: true,
    productCount: counts.all,
    productsWithoutPhoto: counts.noPhoto,
    canPublish: true,
  },
};

export const demoAdminHandlers = (options?: RequestHandlerOptions): HttpHandler[] => [
  handleGetMe(() => HttpResponse.json(demoMe), options),
  handleGetShop(() => HttpResponse.json(demoAdminShop), options),
  handleGetProductCounts(() => HttpResponse.json(counts), options),
];
