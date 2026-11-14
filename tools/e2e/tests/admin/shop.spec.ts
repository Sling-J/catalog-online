import { ADMIN_URL, shopUrl } from '../../e2e-env.ts';
import { createProduct, expect, loginAsDemo, newShop, test, visit } from '../../fixtures/test.ts';

// Админка: раздел «Магазин» (FR-A6, FR-A7, FR-A9), публикация, главная и статистика (FR-A10). Изменения — в своём
// магазине; статистика — у демо-магазина сида (там есть данные). Точный список запросов на каждом шаге (T-502).

test('«О магазине»: сохранение — один запрос, без перечитывания аккаунта и магазина', async ({
  page,
  api,
  isMobile,
}) => {
  await newShop(page);
  await visit(page, api, `${ADMIN_URL}/shop/info`);
  await page.getByLabel(/Адрес/).first().fill('Шымкент, ТЦ «Мега», бутик 1');
  await api.expectRequests(
    // на телефоне кнопка сохранения в шапке — «Готово»
    () =>
      page
        .getByRole('button', { name: isMobile ? 'Готово' : 'Сохранить', exact: true })
        .filter({ visible: true })
        .first()
        .click(),
    // на телефоне «Готово» возвращает на экран «Магазин»: при первом открытии он берёт категории и свойства
    isMobile
      ? ['PATCH /v1/admin/shop', 'GET /v1/admin/categories', 'GET /v1/admin/attributes']
      : ['PATCH /v1/admin/shop'],
  );
  await page.goto(`${ADMIN_URL}/shop/info`, { waitUntil: 'networkidle' });
  await expect(page.getByLabel(/Адрес/).first()).toHaveValue('Шымкент, ТЦ «Мега», бутик 1');
});

test('«Наличие на витрине»: выбор сохраняется сразу — один запрос на изменение', async ({ page, api }) => {
  await newShop(page);
  await visit(page, api, `${ADMIN_URL}/shop/stock`);
  await api.expectRequests(
    () =>
      page
        .getByRole('radio', { name: /Точное количество/ })
        .first()
        .click(),
    ['PATCH /v1/admin/shop'],
  );
  await api.expectRequests(
    () =>
      page
        .getByRole('switch', { name: /Показывать закончившиеся/ })
        .first()
        .click(),
    ['PATCH /v1/admin/shop'],
  );
});

test('категории: создать — дерево перечитывается, товары нет', async ({ page, api }) => {
  await newShop(page);
  await visit(page, api, `${ADMIN_URL}/shop/categories`);
  await page.getByRole('button', { name: '+ Категория' }).filter({ visible: true }).first().click();
  const sheet = page.getByRole('dialog', { name: 'Новая категория' });
  await sheet.getByLabel('Название').fill('Пижамы');
  await api.expectRequests(
    () => sheet.getByRole('button', { name: 'Добавить', exact: true }).click(),
    ['POST /v1/admin/categories', 'GET /v1/admin/categories'],
  );
  await expect(page.getByText('Пижамы').first()).toBeVisible();
});

test('публикация и снятие: один запрос на действие, витрина открывается и закрывается', async ({ page, api }) => {
  const shop = await newShop(page);
  await createProduct(page, { name: 'Платье летнее' });
  await visit(page, api, `${ADMIN_URL}/shop`);
  await api.expectRequests(
    () => page.getByRole('button', { name: 'Опубликовать витрину' }).filter({ visible: true }).first().click(),
    ['POST /v1/admin/shop/publish'],
  );
  await expect(page.getByText('Витрина опубликована').first()).toBeVisible();
  const opened = await page.request.get(shopUrl(shop.subdomain));
  expect(opened.status()).toBe(200);

  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Снять', exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('Снять витрину с публикации?')).toBeVisible();
  await api.expectRequests(
    () => page.locator('dialog[open]').getByRole('button', { name: 'Снять', exact: true }).click(),
    ['POST /v1/admin/shop/unpublish'],
  );
  const hidden = await page.request.get(shopUrl(shop.subdomain));
  expect(hidden.status()).toBe(410);
});

test('главная и статистика: переходы туда-обратно берут данные из кеша, новый период — один запрос', async ({
  page,
  api,
  isMobile,
}) => {
  await loginAsDemo(page);
  await visit(page, api, `${ADMIN_URL}/`);
  await api.expectRequests(async () => {
    await page
      .getByRole('link', { name: /Статистика/ })
      .filter({ visible: true })
      .first()
      .click();
    await page.waitForURL(/\/stats/, { waitUntil: 'commit' });
  }, []);
  await expect(page.getByRole('heading', { name: 'Статистика' })).toBeVisible();
  await api.expectRequests(
    () =>
      page
        .getByRole('button', { name: /30 дней/ })
        .or(page.getByRole('tab', { name: /30 дней/ }))
        .first()
        .click(),
    ['GET /v1/admin/stats?period=30d'],
  );
  await api.expectRequests(
    () =>
      page
        .getByRole('button', { name: /Неделя|7 дней/ })
        .or(page.getByRole('tab', { name: /Неделя|7 дней/ }))
        .first()
        .click(),
    [],
  );
  // на телефоне статистика — вложенный экран без нижнего меню: назад — кнопкой «Назад»
  await api.expectRequests(async () => {
    if (isMobile) await page.goBack();
    else await page.getByRole('link', { name: 'Главная' }).filter({ visible: true }).first().click();
    await page.waitForURL(`${ADMIN_URL}/`, { waitUntil: 'commit' });
  }, []);
});
