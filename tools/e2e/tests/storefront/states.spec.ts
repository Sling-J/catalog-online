import { DEMO, LANDING_URL, shopUrl } from '../../e2e-env.ts';
import { apiCall, createProduct, expect, newShop, publishShop, test, visit } from '../../fixtures/test.ts';

// Состояния витрины: скрытый магазин (410), черновик в превью (A7), чужой адрес, лендинг и служебные файлы.
// Магазины для этих сценариев — свои, через API: демо-магазин общий.

test('скрытый магазин: страница 410 с контактами, запросов из браузера нет', async ({ page, api }) => {
  const shop = await newShop(page);
  await createProduct(page, { name: 'Платье летнее' });
  await publishShop(page);
  await apiCall(page, 'POST', '/v1/admin/shop/unpublish');
  api.allowResource(`${shop.subdomain}.localhost:*/`);

  const response = await page.goto(shopUrl(shop.subdomain), { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(410);
  await expect(page.getByText(/обновляется/)).toBeVisible();
  await expect(page.getByRole('link', { name: /WhatsApp/ }).first()).toHaveAttribute('href', /wa\.me\/77001234567/);
  await api.settle();
  expect(api.calls).toEqual([]);
});

test('черновик в превью: плашка «Черновик», токен в каждом запросе, просмотры не считаются', async ({ page, api }) => {
  const shop = await newShop(page);
  await createProduct(page, { name: 'Куртка весенняя', variants: [{ price: 15900, stock: 3 }] });
  await createProduct(page, { name: 'Шапка вязаная', variants: [{ price: 4900, stock: 2 }] });
  const { token } = await apiCall<{ token: string }>(page, 'POST', '/v1/admin/preview-token');

  await visit(page, api, shopUrl(shop.subdomain, `/?preview=${token}`));
  await expect(page.getByText('Черновик').first()).toBeVisible();
  expect(api.calls).toEqual([]);

  // переход внутри витрины: запрос карточки идёт с токеном, просмотр карточки не отправляется
  const calls = await api.expectRequests(
    () => page.locator('a[aria-label="Шапка вязаная"]').click(),
    [`GET /v1/storefront/${shop.subdomain}/products/*`],
  );
  expect(new URL(calls[0]!.url).searchParams.get('preview')).toBe(token);
  await expect(page).toHaveURL(/preview=/);

  // без токена черновик покупателю не отвечает
  api.allowResource(`${shop.subdomain}.localhost:*/`);
  const response = await page.goto(shopUrl(shop.subdomain), { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(404);
});

test('несуществующий магазин — 404', async ({ page, api }) => {
  api.allowResource('net-takogo-magazina.localhost:*/');
  const response = await page.goto(shopUrl('net-takogo-magazina'), { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(404);
  await api.settle();
  expect(api.calls).toEqual([]);
});

test('лендинг: без запросов к API, «Посмотреть пример» ведёт в демо-магазин', async ({ page, api }) => {
  await visit(page, api, LANDING_URL);
  expect(api.calls).toEqual([]);
  await expect(page.getByRole('link', { name: /пример/i }).first()).toHaveAttribute(
    'href',
    new RegExp(`${DEMO.subdomain}\\.localhost:3100`),
  );
});

test('sitemap.xml и robots.txt магазина', async ({ page }) => {
  const sitemap = await page.request.get(shopUrl(DEMO.subdomain, '/sitemap.xml'));
  expect(sitemap.status()).toBe(200);
  const xml = await sitemap.text();
  expect(xml).toContain(`<loc>${shopUrl(DEMO.subdomain)}</loc>`);
  expect(xml).toMatch(/\?category=/);
  const robots = await page.request.get(shopUrl(DEMO.subdomain, '/robots.txt'));
  expect(robots.status()).toBe(200);
  expect(await robots.text()).toContain('Sitemap:');
});
