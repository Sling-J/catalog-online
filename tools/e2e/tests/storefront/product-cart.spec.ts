import { DEMO, shopUrl } from '../../e2e-env.ts';
import { expect, storefrontApi, test, visit } from '../../fixtures/test.ts';

// Витрина демо-магазина: карточка, корзина и заказ в WhatsApp (FR-V6, FR-V7). Только чтение данных магазина.
const SHOP = DEMO.subdomain;
const API = `/v1/storefront/${SHOP}`;

type Card = { shortId: string; slug: string; name: string; stockLevel: 'in' | 'low' | 'out' };
type Product = {
  id: string;
  shortId: string;
  slug: string;
  name: string;
  attributes: { id: string; name: string; values: { id: string; value: string }[] }[];
  variants: { id: string; valueIds: string[]; price: number; stock: { level: 'in' | 'low' | 'out' } }[];
};

/** Товар с размерами, у которого есть вариант в наличии, и подпись значения этого варианта. */
async function productWithSizes(): Promise<{ product: Product; size: string; price: number }> {
  const { items } = await storefrontApi<{ items: Card[] }>(SHOP, '/products?limit=30');
  for (const card of items.filter((c) => c.stockLevel !== 'out')) {
    const product = await storefrontApi<Product>(SHOP, `/products/${card.shortId}`);
    if (product.attributes.length !== 1) continue;
    const variant = product.variants.find((v) => v.stock.level !== 'out');
    if (!variant) continue;
    const size = product.attributes[0]!.values.find((value) => variant.valueIds.includes(value.id))!.value;
    return { product, size, price: variant.price };
  }
  throw new Error('В демо-магазине нет товара с одним свойством и вариантом в наличии');
}

test('карточка по прямой ссылке приходит готовой: из браузера только просмотр карточки', async ({
  page,
  api,
  isMobile,
}) => {
  const { product } = await productWithSizes();
  await visit(page, api, shopUrl(SHOP, `/${product.slug}-${product.shortId}`));
  await expect(page.getByRole('heading', { level: 1, name: product.name })).toBeVisible();
  const expected = [`POST ${API}/events`];
  // на компьютере карточка — окно поверх каталога: каталог под ним догружается после гидратации (`routes/$product.tsx`)
  if (!isMobile) expected.push(`GET ${API}/categories`, `GET ${API}/products?limit=30`, `GET ${API}/facets`);
  expect(api.calls.map((call) => `${call.method} ${call.path}`).sort()).toEqual(expected.sort());
  expect(JSON.parse(api.calls.find((call) => call.method === 'POST')!.body!)).toEqual({
    type: 'view',
    productId: product.id,
  });
  // закрыть карточку: каталог уже есть — на компьютере под окном, на телефоне его данные ещё не нужны были
  await api.expectRequests(
    () => page.getByRole('button', { name: isMobile ? 'Назад к каталогу' : 'Закрыть', exact: true }).click(),
    isMobile
      ? [`GET ${API}/categories`, `GET ${API}/products?limit=30`, `GET ${API}/facets`, `POST ${API}/events`]
      : [`POST ${API}/events`],
  );
});

test('корзина: добавление без запросов, при открытии — одна перепроверка, заказ — событие и ссылка WhatsApp', async ({
  page,
  api,
}) => {
  const { product, size, price } = await productWithSizes();
  await visit(page, api, shopUrl(SHOP, `/${product.slug}-${product.shortId}`));

  await api.expectRequests(async () => {
    await page.getByRole('button', { name: size, exact: true }).click();
    await page.getByRole('button', { name: /^В корзину/ }).click();
  }, []);
  const opened = await api.expectRequests(
    () => page.getByRole('button', { name: 'В корзине · открыть' }).click(),
    [`POST ${API}/cart/check`],
  );
  expect(JSON.parse(opened[0]!.body!)).toEqual({ items: [{ variantId: expect.any(String), quantity: 1 }] });
  const cart = page.locator('dialog[open]');
  await expect(cart.getByRole('heading', { name: 'Корзина' })).toBeVisible();

  // количество меняется на месте, без запросов
  await api.expectRequests(() => cart.getByRole('button', { name: 'Больше' }).click(), []);
  await expect(
    cart.getByText(new Intl.NumberFormat('ru-RU').format(price * 2).replace(/\s/g, ' ')).first(),
  ).toBeVisible();

  const order = cart.getByRole('link', { name: 'Заказать через WhatsApp' });
  const href = decodeURIComponent((await order.getAttribute('href'))!);
  expect(href).toContain('https://wa.me/');
  expect(href).toContain(product.name);
  expect(href).toContain('× 2');

  const clicked = await api.expectRequests(async () => {
    const popup = page
      .context()
      .waitForEvent('page', { timeout: 5_000 })
      .catch(() => null);
    await order.click();
    await (await popup)?.close();
  }, [`POST ${API}/events`]);
  expect(JSON.parse(clicked[0]!.body!)).toEqual({ type: 'order_click' });
  await expect(page.getByText('Заявка ушла в WhatsApp')).toBeVisible();
});

test('несуществующий товар: страница 404 и ссылка в каталог', async ({ page, api }) => {
  api.allowResource(`${SHOP}.localhost:*/net-takogo-zzzzz`);
  api.allowStatus(`GET ${API}/products/zzzzz`, 404);
  const response = await page.goto(shopUrl(SHOP, '/net-takogo-zzzzz'), { waitUntil: 'networkidle' });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('heading', { level: 1, name: 'Такого товара нет' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Открыть каталог' })).toBeVisible();
  await api.settle();
});
