import { expect, test } from '@playwright/test';

// Новый магазин: регистрация → мастер из четырёх шагов → главная с чек-листом (FR-A2). Ловит UX-аудит E1: после
// регистрации конец мастера возвращал на первый шаг, потому что `me` не перечитывался.
test('регистрация, мастер и главная до запуска', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));

  // моки держат сессию в localStorage (без записи — вход в демо-магазин): начинаем «не вошли»
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('catalog-admin-mock-session', JSON.stringify({ kind: 'out' })));
  await page.goto('/register');

  await page.getByLabel('Email').fill(`e2e-${Date.now()}@shop.test`);
  await page.getByLabel('Пароль').fill('mockpass123');
  await page.getByRole('button', { name: 'Создать каталог' }).click();
  await page.waitForURL(/\/setup/, { waitUntil: 'commit' });

  // 1. название (поле заполняем, когда шаг готов: до этого форма ещё может начаться заново)
  await expect(page.getByRole('heading', { name: 'Как называется магазин?' })).toBeVisible();
  const name = page.getByRole('textbox', { name: 'Название магазина' });
  await expect(async () => {
    await name.fill('Тест Детское');
    await expect(name).toHaveValue('Тест Детское', { timeout: 500 });
  }).toPass();
  await page
    .getByRole('button', { name: /Дальше/ })
    .first()
    .click();
  // 2. адрес витрины — предложен по названию
  await page.waitForURL(/step=2/, { waitUntil: 'commit' });
  await expect(page.getByText('Адрес свободен').filter({ visible: true })).toBeVisible();
  await page
    .getByRole('button', { name: /Дальше/ })
    .first()
    .click();
  // 3. WhatsApp
  await page.waitForURL(/step=3/, { waitUntil: 'commit' });
  const phone = page.locator('input').first();
  await expect(async () => {
    await phone.fill('7011234567');
    await expect(phone).not.toHaveValue('', { timeout: 500 });
  }).toPass();
  await page
    .getByRole('button', { name: /Дальше/ })
    .first()
    .click();
  // 4. логотип — без него одна кнопка «Пропустить» (A33)
  await page.waitForURL(/step=4/, { waitUntil: 'commit' });
  await expect(page.getByRole('button', { name: /Готово/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Пропустить' }).first().click();

  // главная, а не снова мастер: мастер засчитан, обе причины под неактивной кнопкой
  await page.waitForURL((url) => url.pathname === '/', { waitUntil: 'commit' });
  await expect(page.getByRole('heading', { name: 'Осталось немного до запуска' })).toBeVisible();
  await expect(page.getByText('1 из 5 шагов готово').filter({ visible: true })).toBeVisible();
  await expect(
    page.getByText('Чтобы опубликовать, добавьте товары и подтвердите почту').filter({ visible: true }),
  ).toBeVisible();

  // после перезагрузки остаёмся на главной
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Осталось немного до запуска' })).toBeVisible();
  expect(errors).toEqual([]);
});
