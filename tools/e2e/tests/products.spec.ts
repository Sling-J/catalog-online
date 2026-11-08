import { expect, type Page, test } from '@playwright/test';

// Демо-магазин «Айгерим Kids» на моках: порядок списка и выбор категории (UX-аудит, E3, U8, U9).
const asDemo = async (page: Page) => {
  await page.goto('/login');
  await page.evaluate(() => localStorage.setItem('catalog-admin-mock-session', JSON.stringify({ kind: 'demo' })));
};

test.describe('компьютер', () => {
  test.skip(({ isMobile, viewport }) => isMobile || (viewport?.width ?? 0) < 1024, 'только на компьютере');

  test('порядок — нажатием на заголовки таблицы', async ({ page }) => {
    await asDemo(page);
    await page.goto('/products');
    const price = page.getByRole('columnheader', { name: 'Цена' });
    await price.getByRole('button').click();
    await expect(page).toHaveURL(/sort=price_asc/);
    await expect(price).toHaveAttribute('aria-sort', 'ascending');
    await price.getByRole('button').click();
    await expect(page).toHaveURL(/sort=price_desc/);
    await expect(price).toHaveAttribute('aria-sort', 'descending');
    await price.getByRole('button').click();
    await expect(page).not.toHaveURL(/sort=/);
  });

  test('категория — свой список с «Настроить категории»', async ({ page }) => {
    await asDemo(page);
    await page.goto('/products');
    await page.getByRole('button', { name: /^Категория:/ }).click();
    const list = page.getByRole('listbox', { name: 'Категория' });
    await expect(list).toBeVisible();
    await expect(list.getByRole('option', { name: 'Все категории' })).toHaveAttribute('aria-selected', 'true');
    // стрелками и Enter — как у системного списка
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await expect(list).toBeHidden();
    await expect(page).toHaveURL(/category=/);
    // Esc закрывает без выбора
    await page.getByRole('button', { name: /^Категория:/ }).click();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    // действие под чертой
    await page.getByRole('button', { name: /^Категория:/ }).click();
    await list.getByRole('option', { name: 'Настроить категории' }).click();
    await expect(page).toHaveURL(/\/shop\/categories/);
  });

  test('новая категория прямо из нового товара', async ({ page }) => {
    await asDemo(page);
    await page.goto('/products/new');
    await page.getByLabel('Категория', { exact: true }).click();
    await page.getByRole('option', { name: 'Новая категория' }).click();
    const sheet = page.locator('dialog[open]');
    await sheet.getByLabel('Название').fill('Пижамы');
    await sheet.getByRole('button', { name: /Создать|Добавить|Сохранить/ }).click();
    await expect(page.getByLabel('Категория', { exact: true })).toHaveText(/Пижамы/);
  });
});

test.describe('телефон', () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 1024, 'только на телефоне');

  test('порядок и категория — в шторке у поиска', async ({ page }) => {
    await asDemo(page);
    await page.goto('/products');
    await page.getByRole('button', { name: 'Порядок и категория', exact: true }).click();
    const sheet = page.locator('dialog[open]');
    await sheet.getByRole('radio', { name: 'Сначала дорогие' }).click();
    await expect(page).toHaveURL(/sort=price_desc/);
  });

  test('категория в товаре — шторка с действиями', async ({ page }) => {
    await asDemo(page);
    await page.goto('/products/new');
    await page.getByRole('button', { name: 'Категория', exact: true }).click();
    const sheet = page.locator('dialog[open]');
    await expect(sheet.getByRole('heading', { name: 'Категория' })).toBeVisible();
    await expect(sheet.getByRole('button', { name: 'Настроить категории' })).toBeVisible();
    await sheet.getByRole('radio').nth(1).click();
    await expect(page.locator('dialog[open]')).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Категория', exact: true })).not.toHaveText(/Без категории/);
  });
});
