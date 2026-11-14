import { DEMO, shopUrl } from '../../e2e-env.ts';
import { expect, storefrontApi, test, visit } from '../../fixtures/test.ts';

// Витрина демо-магазина: каталог (FR-V1–V5). Только чтение — магазин сида общий для всех тестов.
// На каждом шаге — точный список запросов браузера к API (решение основателя 2026-11-14, T-502).
const SHOP = DEMO.subdomain;
const API = `/v1/storefront/${SHOP}`;

type Category = { id: string; name: string; productCount: number; children: Category[] };

test.describe('каталог', () => {
  test('первая загрузка приходит готовой: из браузера только просмотр витрины', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    await expect(page.getByRole('button', { name: /О магазине/ })).toContainText('Айгерим Kids');
    expect(api.calls.map((call) => `${call.method} ${call.path}`)).toEqual([`POST ${API}/events`]);
    expect(JSON.parse(api.calls[0]!.body!)).toEqual({ type: 'view', productId: null });
  });

  test('просмотр витрины засчитывается раз в сутки на покупателя', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    await api.expectRequests(() => page.reload({ waitUntil: 'networkidle' }), []);
  });

  test('категория — товары и фасеты один раз, возврат и повтор — из кеша', async ({ page, api }) => {
    const categories = await storefrontApi<Category[]>(SHOP, '/categories');
    const category = categories.find((c) => c.productCount > 0)!;
    await visit(page, api, shopUrl(SHOP));
    const chip = page.getByRole('button', { name: category.name, exact: true });
    await api.expectRequests(
      () => chip.click(),
      [`GET ${API}/products?categoryId=${category.id}&limit=30`, `GET ${API}/facets?categoryId=${category.id}`],
    );
    await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
    await api.expectRequests(() => page.getByRole('button', { name: 'Все', exact: true }).click(), []);
    await api.expectRequests(() => chip.click(), []);
  });

  test('поиск ждёт паузу в наборе: один запрос на слово, очистка — из кеша', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    const search = page.getByRole('searchbox');
    await api.expectRequests(
      () => search.pressSequentially('плат', { delay: 70 }),
      [`GET ${API}/products?limit=30&q=плат`, `GET ${API}/facets?q=плат`],
    );
    await expect(page).toHaveURL(/q=/);
    await api.expectRequests(() => search.fill(''), []);
  });

  test('фильтры: значение — товары и фасеты; цена — после ухода из поля; сброс — из кеша', async ({
    page,
    api,
    isMobile,
  }) => {
    await visit(page, api, shopUrl(SHOP));
    await api.expectRequests(() => page.getByRole('button', { name: 'Фильтры' }).first().click(), []);
    const panel = isMobile ? page.locator('dialog[open]') : page.locator('[aria-label="Фильтры"]').last();
    const values = panel.getByRole('button', { name: /^\d+$/ });
    await api.expectRequests(
      () => values.first().click(),
      [`GET ${API}/products?limit=30&values=*`, `GET ${API}/facets?values=*`],
    );
    await api.expectRequests(async () => {
      await panel.getByLabel('Цена от, ₸').pressSequentially('5000', { delay: 50 });
      await panel.getByLabel('Цена до, ₸').click();
    }, [`GET ${API}/products?limit=30&priceMin=5000&values=*`, `GET ${API}/facets?priceMin=5000&values=*`]);
    await api.expectRequests(() => panel.getByRole('button', { name: 'Сбросить' }).click(), []);
    await expect(page).not.toHaveURL(/values=|priceMin=/);
  });

  test('сортировка перечитывает только товары: фасеты от порядка не зависят', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    await api.expectRequests(
      () => page.getByRole('combobox', { name: 'Сортировка' }).selectOption({ label: 'Сначала дешевле' }),
      [`GET ${API}/products?limit=30&sort=price_asc`],
    );
    await expect(page).toHaveURL(/sort=price_asc/);
  });

  test('догрузка при прокрутке — по курсору один раз, в конце списка запросов нет', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    await page.mouse.move(0, 0);
    await api.expectRequests(() => page.mouse.wheel(0, 30_000), [`GET ${API}/products?cursor=*&limit=30`]);
    await api.expectRequests(() => page.mouse.wheel(0, 30_000), []);
  });

  test('карточка: товар и просмотр карточки; назад в каталог — из кеша', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    const tile = page
      .locator('a[aria-label]')
      .filter({ has: page.locator('img') })
      .first();
    const href = (await tile.getAttribute('href'))!;
    const shortId = /-([a-z0-9]+)(\?|$)/.exec(href)![1]!;
    const calls = await api.expectRequests(
      () => tile.click(),
      [`GET ${API}/products/${shortId}`, `POST ${API}/events`],
    );
    expect(JSON.parse(calls.find((c) => c.method === 'POST')!.body!)).toMatchObject({ type: 'view' });
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await api.expectRequests(() => page.goBack(), []);
    await expect(page.getByRole('searchbox')).toBeVisible();
  });

  test('о магазине: шторка с контактами без запросов', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    await api.expectRequests(() => page.getByRole('button', { name: /О магазине/ }).click(), []);
    await expect(page.getByRole('dialog', { name: 'Айгерим Kids' })).toBeVisible();
  });
});

test.describe('компьютер: наведение', () => {
  test.skip(({ isMobile }) => isMobile, 'наведения на телефоне нет');

  test('наведение на плитку грузит карточку заранее, нажатие — без повторного запроса', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    const tile = page
      .locator('a[aria-label]')
      .filter({ has: page.locator('img') })
      .nth(2);
    const shortId = /-([a-z0-9]+)(\?|$)/.exec((await tile.getAttribute('href'))!)![1]!;
    await api.expectRequests(async () => {
      await tile.hover();
      await page.waitForTimeout(400);
    }, [`GET ${API}/products/${shortId}`]);
    await api.expectRequests(() => tile.click(), [`POST ${API}/events`]);
  });

  // Плитки проезжают под неподвижным курсором: с задержкой наведения 50 мс за одну прокрутку грузились три карточки
  // зря (T-502); теперь задержка 250 мс (`defaultPreloadDelay` роутера).
  test('прокрутка колесом над сеткой не грузит карточки, которые проезжают под курсором', async ({ page, api }) => {
    await visit(page, api, shopUrl(SHOP));
    await page.mouse.move(700, 500);
    const mark = api.mark();
    // быстрая прокрутка щелчками колеса по 100 px; до конца страницы не доходим — там курсор остановится на
    // последней плитке, и это уже намерение
    for (let step = 0; step < 20; step++) {
      await page.mouse.wheel(0, 100);
      await page.waitForTimeout(50);
    }
    await page.mouse.move(0, 0);
    await api.settle();
    const preloaded = api.since(mark).filter((call) => /\/products\/[a-z0-9]+$/.test(call.path));
    expect(preloaded.map((call) => call.path)).toEqual([]);
  });
});
