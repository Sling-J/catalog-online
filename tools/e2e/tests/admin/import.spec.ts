import { writeFileSync } from 'node:fs';

import { ADMIN_URL, shopUrl } from '../../e2e-env.ts';
import { expect, newShop, publishShop, test, visit } from '../../fixtures/test.ts';
import type { ApiCall } from '../../fixtures/api-log.ts';

// Админка: импорт Excel/CSV (FR-A3, api.md «Импорт») — файл прямо в хранилище, разбор и применение в фоне, админка
// опрашивает статус. Каждый тест — в своём магазине. Опрос `GET /v1/admin/imports/{id}` — законный повтор.

const IMPORT = /^GET \/v1\/admin\/imports\/[0-9a-f-]+$/;
const names = (calls: ApiCall[]) => calls.map((call) => `${call.method} ${call.path}`);
/** Запросы шага без опроса статуса — их проверяем точно. */
const withoutPolls = (calls: ApiCall[]) => names(calls).filter((call) => !IMPORT.test(call));

function csv(testInfo: { outputPath: (name: string) => string }, name: string, lines: string[]): string {
  const file = testInfo.outputPath(name);
  writeFileSync(file, `${lines.join('\n')}\n`, 'utf8');
  return file;
}

test.beforeEach(({ api }) => api.allowRepeat('GET /v1/admin/imports/*'));

test('файл по шаблону: колонки узнаны, проверка, загрузка — товары появились в админке и на витрине', async ({
  page,
  api,
}, testInfo) => {
  const shop = await newShop(page);
  const file = csv(testInfo, 'tovary.csv', [
    'Артикул;Название;Цена;Остаток;Категория;Размер',
    'E2E-1;Футболка e2e;5 900;4;Футболки;110',
    'E2E-2;Футболка e2e;5 900;2;Футболки;116',
    'E2E-3;Шорты e2e;4 500;0;Шорты;110',
  ]);
  await visit(page, api, `${ADMIN_URL}/import`);

  let mark = api.mark();
  await page.locator('input[type=file]').first().setInputFiles(file);
  await expect(page.getByText('Ошибок нет — загрузим все строки').filter({ visible: true })).toBeVisible({
    timeout: 30_000,
  });
  await api.settle(2_500);
  expect(withoutPolls(api.since(mark)).sort()).toEqual(['POST /v1/admin/imports', 'POST /v1/admin/uploads']);
  // опрос раз в секунду, пока файл читается и проверяется; после «проверено» — тишина (settle выше)
  expect(names(api.since(mark)).filter((call) => IMPORT.test(call)).length).toBeLessThanOrEqual(20);

  mark = api.mark();
  await page
    .getByRole('button', { name: /^Загрузить \d/ })
    .filter({ visible: true })
    .click();
  await expect(page.getByText('Товары загружены').filter({ visible: true })).toBeVisible({ timeout: 30_000 });
  await api.settle(2_500);
  // применить, опрос до «готово»; затем счётчики и чек-лист магазина один раз; история — из ответа, без запроса
  expect(withoutPolls(api.since(mark)).sort()).toEqual(
    [
      expect.stringMatching(/^POST \/v1\/admin\/imports\/[0-9a-f-]+\/apply$/),
      'GET /v1/admin/products/counts',
      'GET /v1/admin/shop',
    ].sort(),
  );

  await api.expectRequests(async () => {
    await page
      .getByRole('button', { name: 'К товарам' })
      .or(page.getByRole('link', { name: 'К товарам' }))
      .first()
      .click();
    await page.waitForURL(/\/products/, { waitUntil: 'commit' });
  }, ['GET /v1/admin/products?limit=30', 'GET /v1/admin/categories']);
  await expect(page.getByText('Футболка e2e').first()).toBeVisible();

  // на витрине — после публикации
  await publishShop(page);
  await page.goto(shopUrl(shop.subdomain), { waitUntil: 'networkidle' });
  await expect(page.locator('a[aria-label="Футболка e2e"]')).toBeVisible();
});

test('чужие заголовки: шаг «Колонки», сопоставление сохраняется одним запросом', async ({ page, api }, testInfo) => {
  await newShop(page);
  const file = csv(testInfo, 'iz-1c.csv', [
    'Номенклатура;Код;Цена розничная;Количество',
    'Кофта e2e;K-1;7 900;3',
    'Носки e2e;K-2;900;12',
  ]);
  await visit(page, api, `${ADMIN_URL}/import`);
  await page.locator('input[type=file]').first().setInputFiles(file);
  await expect(
    page
      .getByText('Все обязательные поля найдены')
      .or(page.getByText(/Не хватает/))
      .filter({ visible: true })
      .first(),
  ).toBeVisible({
    timeout: 20_000,
  });
  await api.settle(2_500);
  const mark = api.mark();
  await page.getByRole('button', { name: 'Дальше: проверка →' }).filter({ visible: true }).click();
  await expect(page.getByText('Ошибок нет — загрузим все строки').filter({ visible: true })).toBeVisible({
    timeout: 30_000,
  });
  await api.settle(2_500);
  expect(withoutPolls(api.since(mark))).toEqual([
    expect.stringMatching(/^PUT \/v1\/admin\/imports\/[0-9a-f-]+\/mapping$/),
  ]);
});

test('история импортов: список без лишних запросов', async ({ page, api }, testInfo) => {
  await newShop(page);
  const file = csv(testInfo, 'odin.csv', ['Артикул;Название;Цена;Остаток', 'H-1;Пижама e2e;6 500;2']);
  await visit(page, api, `${ADMIN_URL}/import`);
  await page.locator('input[type=file]').first().setInputFiles(file);
  await expect(page.getByText('Ошибок нет — загрузим все строки').filter({ visible: true })).toBeVisible({
    timeout: 30_000,
  });
  await api.settle(2_500);
  // история прямой ссылкой: аккаунт, магазин и счётчики (меню), ссылка на превью черновика и сам список
  await visit(page, api, `${ADMIN_URL}/import/history`);
  expect(names(api.since(api.calls.findLastIndex((call) => call.path === '/v1/auth/me'))).sort()).toEqual(
    [
      'GET /v1/auth/me',
      'GET /v1/admin/shop',
      'GET /v1/admin/products/counts',
      'POST /v1/admin/preview-token',
      'GET /v1/admin/imports?limit=20',
    ].sort(),
  );
  await expect(page.getByText('odin.csv').first()).toBeVisible();
});
