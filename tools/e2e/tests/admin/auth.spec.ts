import { resolve } from 'node:path';

import { ADMIN_URL, DEMO, ROOT } from '../../e2e-env.ts';
import { expect, linkFrom, newShop, readMail, test, unique, visit } from '../../fixtures/test.ts';

// Админка: вход, регистрация с мастером, письма, пароль, выход (FR-A1, FR-A2). Каждый тест, который что-то меняет,
// работает в своём магазине. На каждом шаге — точный список запросов к API (T-502).

/** Главная после входа: магазин, счётчики, статистика недели, последние импорты. */
const HOME = [
  'GET /v1/admin/shop',
  'GET /v1/admin/products/counts',
  'GET /v1/admin/stats?period=7d',
  'GET /v1/admin/imports?limit=20',
];

test('вход: неверный пароль — ошибка, верный — главная одним набором запросов', async ({ page, api }) => {
  await visit(page, api, `${ADMIN_URL}/login`);
  expect(api.calls.map((call) => `${call.method} ${call.path}`)).toEqual(['GET /v1/auth/me']);

  api.allowStatus('POST /v1/auth/login', 401);
  await page.getByLabel('Email').fill(DEMO.email);
  await page.getByLabel('Пароль').fill('не-тот-пароль');
  await api.expectRequests(() => page.getByRole('button', { name: 'Войти' }).click(), ['POST /v1/auth/login']);
  await expect(
    page
      .getByRole('alert')
      .or(page.getByText(/неверн/i))
      .first(),
  ).toBeVisible();

  await page.getByLabel('Пароль').fill(DEMO.password);
  await api.expectRequests(async () => {
    await page.getByRole('button', { name: 'Войти' }).click();
    await page.waitForURL(`${ADMIN_URL}/`, { waitUntil: 'commit' });
  }, ['POST /v1/auth/login', ...HOME]);
  await expect(page.getByRole('heading', { name: 'Главная' })).toBeVisible();
});

test('регистрация и мастер: шаг — одно сохранение, без перечитывания аккаунта', async ({ page, api }) => {
  const email = `e2e-${unique()}@shop.test`;
  await visit(page, api, `${ADMIN_URL}/register`);
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Пароль').fill('e2e-password-1');
  await api.expectRequests(async () => {
    await page.getByRole('button', { name: 'Создать каталог' }).click();
    await page.waitForURL(/\/setup/, { waitUntil: 'commit' });
  }, ['POST /v1/auth/register', 'GET /v1/admin/shop']);

  // 1. название — ввод без запросов; «Дальше» сохраняет и сразу проверяет предложенный адрес
  const name = page.getByRole('textbox', { name: 'Название магазина' });
  await api.expectRequests(() => name.pressSequentially('Тест Детское', { delay: 30 }), []);
  await api.expectRequests(async () => {
    await page
      .getByRole('button', { name: /Дальше/ })
      .first()
      .click();
    await page.waitForURL(/step=2/, { waitUntil: 'commit' });
  }, ['PATCH /v1/admin/shop', 'GET /v1/admin/shop/subdomain-availability?value=test-detskoe']);
  await expect(page.getByText('Адрес свободен').filter({ visible: true })).toBeVisible();

  // 2. свой адрес: проверка — один раз после паузы в наборе, а не на каждую букву
  const subdomain = `moi-${unique()}`;
  const address = page.getByRole('textbox').first();
  await address.fill('');
  await api.expectRequests(
    () => address.pressSequentially(subdomain, { delay: 40 }),
    [`GET /v1/admin/shop/subdomain-availability?value=${subdomain}`],
  );
  await api.expectRequests(async () => {
    await page
      .getByRole('button', { name: /Дальше/ })
      .first()
      .click();
    await page.waitForURL(/step=3/, { waitUntil: 'commit' });
  }, ['PATCH /v1/admin/shop']);

  // 3. WhatsApp
  await page.locator('input[type=tel]').first().fill('7011234567');
  await api.expectRequests(async () => {
    await page
      .getByRole('button', { name: /Дальше/ })
      .first()
      .click();
    await page.waitForURL(/step=4/, { waitUntil: 'commit' });
  }, ['PATCH /v1/admin/shop']);

  // 4. логотип: ссылка на загрузку, файл прямо в хранилище (не API), логотип магазину
  await expect(page.getByRole('button', { name: /Готово/ })).toHaveCount(0);
  await api.expectRequests(async () => {
    await page.locator('input[type=file]').first().setInputFiles(resolve(ROOT, 'design-assets/storefront/jacket.jpg'));
    await page
      .getByRole('button', { name: /Готово/ })
      .first()
      .waitFor();
  }, ['POST /v1/admin/uploads', 'PUT /v1/admin/shop/logo']);

  // готово → главная до запуска: аккаунт не перечитывается — «мастер пройден» уже в кеше
  await api.expectRequests(async () => {
    await page
      .getByRole('button', { name: /Готово/ })
      .first()
      .click();
    await page.waitForURL(`${ADMIN_URL}/`, { waitUntil: 'commit' });
  }, [
    'PATCH /v1/admin/shop',
    'GET /v1/admin/products/counts',
    'GET /v1/admin/stats?period=7d',
    'GET /v1/admin/imports?limit=20',
    'POST /v1/admin/preview-token',
  ]);
  await expect(page.getByRole('heading', { name: 'Осталось немного до запуска' })).toBeVisible();
  await expect(
    page.getByText('Чтобы опубликовать, добавьте товары и подтвердите почту').filter({ visible: true }),
  ).toBeVisible();

  // после перезагрузки остаёмся на главной
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.getByRole('heading', { name: 'Осталось немного до запуска' })).toBeVisible();
});

test('подтверждение почты по ссылке из письма', async ({ page, api }) => {
  const shop = await newShop(page, { verify: false });
  const link = linkFrom(await readMail(shop.email, /Подтвердите/));
  expect(link).toContain(`${ADMIN_URL}/verify-email?token=`);
  await api.expectRequests(() => page.goto(link, { waitUntil: 'networkidle' }), ['POST /v1/auth/email/verify']);
  await expect(page.getByText('Почта подтверждена')).toBeVisible();

  // повторно та же ссылка — «устарела»; страница загружена заново, аккаунт нужен, чтобы решить, куда вести дальше
  api.allowStatus('POST /v1/auth/email/verify', 410);
  await api.expectRequests(
    () => page.goto(link, { waitUntil: 'networkidle' }),
    ['POST /v1/auth/email/verify', 'GET /v1/auth/me'],
  );
  await expect(page.getByText('Ссылка устарела')).toBeVisible();
});

test('забыли пароль → письмо → новый пароль → вход с ним', async ({ page, api }) => {
  const shop = await newShop(page);
  await page.context().clearCookies();
  await visit(page, api, `${ADMIN_URL}/forgot-password`);
  await page.getByLabel('Email').fill(shop.email);
  await api.expectRequests(
    () => page.getByRole('button', { name: 'Прислать ссылку' }).click(),
    ['POST /v1/auth/password/forgot'],
  );
  await expect(page.getByText('Проверьте почту')).toBeVisible();

  const link = linkFrom(await readMail(shop.email, /пароль/i));
  expect(link).toContain(`${ADMIN_URL}/reset-password?token=`);
  await visit(page, api, link);
  const password = `new-${unique()}-pass`;
  await page.getByLabel('Новый пароль').fill(password);
  await api.expectRequests(async () => {
    await page.getByRole('button', { name: 'Сохранить пароль' }).click();
    await page.waitForLoadState('networkidle');
  }, ['POST /v1/auth/password/reset', '*']);

  await page.context().clearCookies();
  await visit(page, api, `${ADMIN_URL}/login`);
  await page.getByLabel('Email').fill(shop.email);
  await page.getByLabel('Пароль').fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();
  await page.waitForURL(`${ADMIN_URL}/`, { waitUntil: 'commit' });
  await expect(page.getByRole('heading').first()).toBeVisible();
});

test('смена пароля в аккаунте и выход', async ({ page, api }) => {
  const shop = await newShop(page);
  await visit(page, api, `${ADMIN_URL}/account`);
  await page.getByLabel('Текущий пароль').fill(shop.password);
  await page.getByLabel('Новый пароль').fill(`changed-${unique()}`);
  await api.expectRequests(
    () => page.getByRole('button', { name: 'Сохранить пароль' }).filter({ visible: true }).click(),
    ['POST /v1/auth/password/change'],
  );
  await expect(page.getByText('Пароль сохранён.')).toBeVisible();

  await api.expectRequests(async () => {
    await page.getByRole('button', { name: 'Выйти' }).first().click();
    await page.waitForURL(/\/login/, { waitUntil: 'networkidle' });
  }, ['POST /v1/auth/logout', 'GET /v1/auth/me']);
});
