import { resolve } from 'node:path';

import { ADMIN_URL, ROOT } from '../../e2e-env.ts';
import type { Page } from '@playwright/test';

import { apiCall, createProduct, expect, newShop, test, visit } from '../../fixtures/test.ts';

// Админка: товары (FR-A4, FR-A5, A3). Каждый тест — в своём магазине с тремя товарами без фото (через API).
// На каждом шаге — точный список запросов к API (T-502).

const LIST = 'GET /v1/admin/products?limit=30';
/** После правки, которая меняет видимость, остатки или фото: список, счётчики вкладок, чек-лист магазина. */
const REFRESH = [LIST, 'GET /v1/admin/products/counts', 'GET /v1/admin/shop'];
/** Первая загрузка «Товаров»: аккаунт, магазин и счётчики (меню), список, категории; ссылка на превью черновика. */
const OPEN_LIST = [
  'GET /v1/auth/me',
  'GET /v1/admin/shop',
  'GET /v1/admin/products/counts',
  LIST,
  'GET /v1/admin/categories',
  'POST /v1/admin/preview-token',
];

/** Строка товара: на компьютере — ссылка в таблице, на телефоне — элемент списка. */
const row = (page: Page, name: string) =>
  page
    .getByRole('link', { name, exact: true })
    .or(page.getByRole('listitem').filter({ hasText: name }))
    .first();

test.beforeEach(async ({ page }) => {
  await newShop(page);
  for (const name of ['Платье летнее', 'Куртка весенняя', 'Шапка вязаная']) {
    await createProduct(page, { name, variants: [{ price: 9900, stock: 4 }] });
  }
});

test('список: поиск ждёт паузу, вкладки — один запрос, возврат — из кеша', async ({ page, api }) => {
  await visit(page, api, `${ADMIN_URL}/products`);
  expect(api.calls.map((call) => `${call.method} ${call.path}`).sort()).toEqual([...OPEN_LIST].sort());

  const search = page.getByRole('textbox', { name: 'Поиск товаров' });
  await api.expectRequests(() => search.pressSequentially('плат', { delay: 60 }), [`${LIST}&q=плат`]);
  await expect(row(page, 'Платье летнее')).toBeVisible();
  await api.expectRequests(() => search.fill(''), []);

  await api.expectRequests(
    () =>
      page
        .getByRole('button', { name: /^Без фото/ })
        .first()
        .click(),
    ['GET /v1/admin/products?filter=no_photo&limit=30'],
  );
  await api.expectRequests(() => page.getByRole('button', { name: /^Все/ }).first().click(), []);
});

test('новый товар: «Сохранить и показать» — один запрос и обновление списка', async ({ page, api }) => {
  await visit(page, api, `${ADMIN_URL}/products`);
  await api.expectRequests(
    () => page.getByRole('link', { name: 'Новый товар' }).first().click(),
    ['GET /v1/admin/attributes'],
  );
  await page.getByRole('textbox', { name: 'Название', exact: true }).first().fill('Кофта тёплая');
  await page.getByRole('textbox', { name: 'Цена, ₸' }).first().fill('7900');
  await api.expectRequests(async () => {
    await page.getByRole('button', { name: 'Сохранить и показать' }).first().click();
    await page.waitForURL(/\/products(\?|$)/, { waitUntil: 'commit' });
  }, ['POST /v1/admin/products', ...REFRESH]);
  await expect(row(page, 'Кофта тёплая')).toBeVisible();
});

test('правка только названия — без перечитывания счётчиков и магазина', async ({ page, api }) => {
  await visit(page, api, `${ADMIN_URL}/products`);
  const calls = await api.expectRequests(
    () => row(page, 'Платье летнее').click(),
    ['GET /v1/admin/products/*', 'GET /v1/admin/attributes'],
  );
  const productPath = calls.find((call) => call.path.startsWith('/v1/admin/products/'))!.path;
  await page.getByRole('textbox', { name: 'Название', exact: true }).first().fill('Платье летнее новое');
  await api.expectRequests(async () => {
    await page.getByRole('button', { name: 'Сохранить', exact: true }).first().click();
    await page.waitForURL(/\/products(\?|$)/, { waitUntil: 'commit' });
  }, [`PATCH ${productPath}`, LIST]);
  await expect(row(page, 'Платье летнее новое')).toBeVisible();
});

test('фото товара: загрузка в хранилище, прикрепление, ожидание сжатия; список обновится при возврате', async ({
  page,
  api,
}) => {
  await visit(page, api, `${ADMIN_URL}/products`);
  await row(page, 'Шапка вязаная').click();
  await page.waitForLoadState('networkidle');
  await api.settle();
  // пока фото сжимается, товар перечитывается раз в 2 с (api.md, «Фоновые операции») — повторы законны
  api.allowRepeat('GET /v1/admin/products/*');
  const mark = api.mark();
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles(resolve(ROOT, 'design-assets/storefront/beanie-gray.jpg'));
  await expect(page.locator('img[src*="/photos/"]').first()).toBeVisible({ timeout: 30_000 });
  await api.settle(2_500);
  const calls = api.since(mark).map((call) => `${call.method} ${call.path}`);
  const polls = calls.filter((call) => /^GET \/v1\/admin\/products\/[0-9a-f-]+$/.test(call));
  // ссылка на загрузку, прикрепление, счётчики «Без фото» и чек-лист; затем опрос товара, пока фото не готово
  expect(calls.filter((call) => !polls.includes(call)).sort()).toEqual(
    [
      'GET /v1/admin/products/counts',
      'GET /v1/admin/shop',
      'POST /v1/admin/products/*/photos',
      'POST /v1/admin/uploads',
    ]
      .map((call) => call)
      .sort()
      .map((pattern) => calls.find((call) => new RegExp(`^${pattern.replace(/\*/g, '[^/]+')}$`).test(call))!)
      .sort(),
  );
  expect(polls.length).toBeGreaterThanOrEqual(1);
  // опрос прекращается, когда фото готово: за 2,5 с тишины новых запросов не было (проверил settle)
  expect(polls.length).toBeLessThanOrEqual(10);
  // назад к списку: обложка изменилась — список перечитывается один раз
  await api.expectRequests(() => page.goBack(), [LIST]);
});

test('удаление товара: подтверждение, список и счётчики', async ({ page, api }) => {
  await visit(page, api, `${ADMIN_URL}/products`);
  await row(page, 'Куртка весенняя').click();
  await page.waitForLoadState('networkidle');
  await page.getByRole('button', { name: 'Удалить товар' }).first().click();
  await expect(page.getByText('Удалить товар?')).toBeVisible();
  await api.expectRequests(async () => {
    await page.locator('dialog[open]').getByRole('button', { name: 'Удалить' }).click();
    await page.waitForURL(/\/products(\?|$)/, { waitUntil: 'commit' });
  }, ['DELETE /v1/admin/products/*', ...REFRESH]);
  await expect(page.getByText('Куртка весенняя')).toHaveCount(0);
});

test.describe('компьютер', () => {
  test.skip(({ isMobile }) => isMobile, 'таблица и переключатели — на компьютере');

  test('видимость в строке: правка и обновление списка, счётчиков, чек-листа', async ({ page, api }) => {
    await visit(page, api, `${ADMIN_URL}/products`);
    await api.expectRequests(
      () => page.getByRole('switch').first().click(),
      ['PATCH /v1/admin/products/*', ...REFRESH],
    );
    await expect(page.getByRole('button', { name: /^Скрытые 1/ })).toBeVisible();
  });

  test('массово: выбрать два и скрыть — один запрос на все', async ({ page, api }) => {
    await visit(page, api, `${ADMIN_URL}/products`);
    await page.getByRole('checkbox', { name: 'Выбрать: Платье летнее' }).check();
    await page.getByRole('checkbox', { name: 'Выбрать: Шапка вязаная' }).check();
    await expect(page.getByText(/Выбрано 2/)).toBeVisible();
    await api.expectRequests(
      () => page.getByRole('button', { name: 'Скрыть', exact: true }).first().click(),
      ['POST /v1/admin/products/bulk', ...REFRESH],
    );
    await expect(page.getByRole('button', { name: /^Скрытые 2/ })).toBeVisible();
  });

  test('порядок — нажатием на заголовки таблицы, повтор порядка — из кеша', async ({ page, api }) => {
    await visit(page, api, `${ADMIN_URL}/products`);
    const price = page.getByRole('columnheader', { name: 'Цена' });
    await api.expectRequests(() => price.getByRole('button').click(), [`${LIST}&sort=price_asc`]);
    await expect(price).toHaveAttribute('aria-sort', 'ascending');
    await api.expectRequests(() => price.getByRole('button').click(), [`${LIST}&sort=price_desc`]);
    await expect(price).toHaveAttribute('aria-sort', 'descending');
    await api.expectRequests(() => price.getByRole('button').click(), []);
    await expect(page).not.toHaveURL(/sort=/);
  });

  test('категория — свой список с «Настроить категории»', async ({ page, api }) => {
    const category = await apiCall<{ id: string }>(page, 'POST', '/v1/admin/categories', { name: 'Платья' });
    await visit(page, api, `${ADMIN_URL}/products`);
    await api.expectRequests(() => page.getByRole('button', { name: /^Категория:/ }).click(), []);
    const list = page.getByRole('listbox', { name: 'Категория' });
    await expect(list.getByRole('option', { name: 'Все категории' })).toHaveAttribute('aria-selected', 'true');
    await api.expectRequests(async () => {
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
    }, [`GET /v1/admin/products?categoryId=${category.id}&limit=30`]);
    await expect(page).toHaveURL(new RegExp(`category=${category.id}`));
    await page.getByRole('button', { name: /^Категория:/ }).click();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await page.getByRole('button', { name: /^Категория:/ }).click();
    await api.expectRequests(async () => {
      await list.getByRole('option', { name: 'Настроить категории' }).click();
      await page.waitForURL(/\/shop\/categories/, { waitUntil: 'commit' });
    }, ['GET /v1/admin/attributes']);
  });

  test('новая категория прямо из нового товара', async ({ page, api }) => {
    await visit(page, api, `${ADMIN_URL}/products/new`);
    await page.getByLabel('Категория', { exact: true }).click();
    await page.getByRole('option', { name: 'Новая категория' }).click();
    const sheet = page.locator('dialog[open]');
    await sheet.getByLabel('Название').fill('Пижамы');
    await api.expectRequests(
      () => sheet.getByRole('button', { name: /Создать|Добавить|Сохранить/ }).click(),
      ['POST /v1/admin/categories', 'GET /v1/admin/categories'],
    );
    await expect(page.getByLabel('Категория', { exact: true })).toHaveText(/Пижамы/);
  });
});

test.describe('телефон', () => {
  test.skip(({ isMobile }) => !isMobile, 'шторки — на телефоне');

  test('порядок и категория — в шторке у поиска', async ({ page, api }) => {
    await visit(page, api, `${ADMIN_URL}/products`);
    await page.getByRole('button', { name: 'Порядок и категория', exact: true }).click();
    const sheet = page.locator('dialog[open]');
    await api.expectRequests(
      () => sheet.getByRole('radio', { name: 'Сначала дорогие' }).click(),
      [`${LIST}&sort=price_desc`],
    );
    await expect(page).toHaveURL(/sort=price_desc/);
  });

  test('категория в товаре — шторка с действиями', async ({ page, api }) => {
    await apiCall(page, 'POST', '/v1/admin/categories', { name: 'Платья' });
    await visit(page, api, `${ADMIN_URL}/products/new`);
    await page.getByRole('button', { name: 'Категория', exact: true }).click();
    const sheet = page.locator('dialog[open]');
    await expect(sheet.getByRole('heading', { name: 'Категория' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Настроить категории' })).toBeVisible();
    await api.expectRequests(() => sheet.getByRole('radio').nth(1).click(), []);
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Категория', exact: true })).not.toHaveText(/Без категории/);
  });
});

test('«Фото товаров»: очередь без фото и следующий товар заранее; выход без фото — без перечитывания', async ({
  page,
  api,
}) => {
  await visit(page, api, `${ADMIN_URL}/products`);
  await api.expectRequests(
    () =>
      page
        .getByRole('link', { name: /^(Добавить фото|Снять →)$/ })
        .first()
        .click(),
    ['GET /v1/admin/products?filter=no_photo&limit=100', 'GET /v1/admin/products/*', 'GET /v1/admin/products/*'],
  );
  await api.expectRequests(() => page.goBack(), []);
});
