import { API_URL, ADMIN_URL, STAFF, STAFF_URL } from '../../e2e-env.ts';
import { createProduct, expect, newShop, publishShop, test, visit } from '../../fixtures/test.ts';

import type { Page } from '@playwright/test';

// Суперадминка (FR-S1–S3, ADR 0005): вход сотрудника, список с поиском, блокировка и разблокировка, вход «от имени»
// по одноразовой ссылке. Сотрудник — из сида; магазины для действий — свои, через API.

const LIST = 'GET /v1/staff/shops?limit=30';
const search = (q: string) => `GET /v1/staff/shops?limit=30&q=${q}`;

/** Вход сотрудника запросом из контекста страницы (cookie `staff_sid` — на адрес суперадминки), мимо журнала. */
async function loginStaff(page: Page): Promise<void> {
  const response = await page.request.post(`${STAFF_URL}/v1/staff/login`, {
    data: STAFF,
    headers: { 'X-Requested-With': 'XMLHttpRequest' },
  });
  expect(response.status()).toBe(204);
}

test('вход: без сессии — экран входа; неверный пароль — ошибка; верный — список одним набором; выход', async ({
  page,
  api,
}) => {
  api.allowStatus('GET /v1/staff/me', 401);
  await visit(page, api, STAFF_URL);
  await expect(page).toHaveURL(`${STAFF_URL}/login`);
  expect(api.calls.map((call) => `${call.method} ${call.path}`)).toEqual(['GET /v1/staff/me']);

  api.allowStatus('POST /v1/staff/login', 401);
  await page.getByLabel('Почта').fill(STAFF.email);
  await page.getByLabel('Пароль').fill('не-тот-пароль');
  await api.expectRequests(() => page.getByRole('button', { name: 'Войти' }).click(), ['POST /v1/staff/login']);
  await expect(page.getByText('Неверная почта или пароль')).toBeVisible();

  await page.getByLabel('Пароль').fill(STAFF.password);
  await api.expectRequests(
    () => page.getByRole('button', { name: 'Войти' }).click(),
    ['POST /v1/staff/login', 'GET /v1/staff/me', LIST],
  );
  await expect(page.getByRole('heading', { name: 'Магазины' })).toBeVisible();
  // магазины параллельных тестов — сверху списка, поэтому не ищем конкретный
  await expect(page.getByRole('listitem').first()).toBeVisible();

  await api.expectRequests(
    () => page.getByRole('button', { name: 'Выйти' }).click(),
    ['POST /v1/staff/logout', 'GET /v1/staff/me'],
  );
  await expect(page).toHaveURL(`${STAFF_URL}/login`);
});

test('поиск, блокировка с причиной и разблокировка: действие и одно перечитывание списка', async ({ page, api }) => {
  const shop = await newShop(page);
  await createProduct(page, { name: 'Платье летнее' });
  await publishShop(page);
  await loginStaff(page);
  await visit(page, api, STAFF_URL);

  await api.expectRequests(() => page.getByLabel('Поиск магазинов').fill(shop.subdomain), [search(shop.subdomain)]);
  const row = page.getByRole('listitem', { name: shop.name });
  await expect(row).toBeVisible();
  await expect(page.getByRole('listitem')).toHaveCount(1);
  await expect(row.getByText('Опубликован')).toBeVisible();

  await row.getByRole('button', { name: 'Заблокировать' }).click();
  const dialog = page.locator('dialog[open]');
  await dialog.getByLabel(/Причина/).fill('Спам');
  await api.expectRequests(
    () => dialog.getByRole('button', { name: 'Заблокировать' }).click(),
    ['POST /v1/staff/shops/*/block', search(shop.subdomain)],
  );
  await expect(row.getByText('Заблокирован')).toBeVisible();
  expect((await fetch(`${API_URL}/v1/storefront/${shop.subdomain}`)).status).toBe(410);

  await api.expectRequests(
    () => row.getByRole('button', { name: 'Разблокировать' }).click(),
    ['POST /v1/staff/shops/*/unblock', search(shop.subdomain)],
  );
  await expect(row.getByText('Опубликован')).toBeVisible();
  expect((await fetch(`${API_URL}/v1/storefront/${shop.subdomain}`)).status).toBe(200);
});

test('вход «от имени»: новая вкладка админки с плашкой, ссылка одноразовая', async ({ page, api }) => {
  const shop = await newShop(page);
  await loginStaff(page);
  await visit(page, api, `${STAFF_URL}/?q=${shop.subdomain}`);
  const row = page.getByRole('listitem', { name: shop.name });

  const popup = page.waitForEvent('popup');
  const calls = await api.expectRequests(async () => {
    await row.getByRole('button', { name: 'Войти от имени' }).click();
    const admin = await popup;
    await expect(admin.getByText(`Вы вошли от имени магазина · ${shop.email}`)).toBeVisible();
    await expect(admin).toHaveURL(`${ADMIN_URL}/`);
  }, [
    'POST /v1/staff/shops/*/impersonate',
    'POST /v1/auth/impersonation',
    'GET /v1/auth/me',
    'GET /v1/admin/shop',
    'GET /v1/admin/products/counts',
    'GET /v1/admin/stats?period=7d',
    'GET /v1/admin/imports?limit=20',
    // магазин — черновик: «Посмотреть, как увидят покупатели» ведёт в превью
    'POST /v1/admin/preview-token',
  ]);

  // та же ссылка второй раз не пускает
  const token = JSON.parse(calls.find((call) => call.path === '/v1/auth/impersonation')!.body!).token as string;
  api.allowStatus('POST /v1/auth/impersonation', 410);
  const again = await page.context().newPage();
  await again.goto(`${ADMIN_URL}/impersonate#${token}`);
  await expect(again.getByRole('heading', { name: 'Ссылка устарела' })).toBeVisible();
});
