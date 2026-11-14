import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { test as base, expect, type Page } from '@playwright/test';

import { ADMIN_URL, API_URL, DEMO, MAIL_DIR } from '../e2e-env.ts';
import { ApiLog } from './api-log.ts';

export { expect };

/**
 * Тест e2e: в каждом автоматически журнал запросов к API (`api`) и проверка в конце — без дублей, прерванных
 * запросов, лишних `OPTIONS` и неожиданных ошибок (`api-log.ts`), а также без ошибок JavaScript на странице.
 * Проверка не мешает упавшему тесту показать свою причину: она идёт, только если сам тест прошёл.
 */
export const test = base.extend<{ api: ApiLog }>({
  api: [
    async ({ context }, use, testInfo) => {
      const log = new ApiLog(context);
      const pageErrors: string[] = [];
      context.on('page', (page) => page.on('pageerror', (error) => pageErrors.push(error.message)));
      await use(log);
      if (testInfo.status !== testInfo.expectedStatus) return;
      await log.settle().catch(() => {});
      const issues = [...pageErrors.map((message) => `Ошибка на странице: ${message}`), ...log.issues()];
      if (issues.length) {
        await testInfo.attach('запросы к API', { body: log.describe(), contentType: 'text/plain' });
      }
      expect(issues, `Запросы к API:\n${log.describe()}`).toEqual([]);
    },
    { auto: true },
  ],
});

/**
 * Открыть страницу и дождаться, пока она оживёт: в режиме разработки гидратация занимает секунды, и запросы
 * браузера (события, догрузка) идут после `load`. Мышь уводим в угол — наведение на ссылку грузит страницу заранее.
 */
export async function visit(page: Page, api: ApiLog, url: string): Promise<void> {
  await page.mouse.move(0, 0).catch(() => {});
  await page.goto(url, { waitUntil: 'networkidle' });
  await api.settle();
}

const XRW = { 'X-Requested-With': 'XMLHttpRequest' };

/** Уникальная часть адресов и почт: тесты идут параллельно в одной базе. */
export const unique = (): string => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Запрос к API от имени браузерного контекста (cookie общие): подготовка данных, мимо журнала запросов страницы. */
async function apiCall<T>(
  page: Page,
  method: 'GET' | 'POST' | 'PATCH' | 'PUT',
  path: string,
  data?: unknown,
): Promise<T> {
  const response = await page.request.fetch(`${ADMIN_URL}${path}`, { method, headers: XRW, data });
  if (!response.ok()) throw new Error(`${method} ${path} → ${response.status()}: ${await response.text()}`);
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}
export { apiCall };

type Mail = { to: string; subject: string; text: string };

/** Последнее письмо адресату (папка `MAIL_OUTBOX_DIR` API), ждёт до 10 с. */
export async function readMail(to: string, subject?: RegExp): Promise<Mail> {
  const started = Date.now();
  while (Date.now() - started < 10_000) {
    const files = (await readdir(MAIL_DIR).catch(() => [] as string[])).sort().reverse();
    for (const file of files) {
      const mail = JSON.parse(await readFile(join(MAIL_DIR, file), 'utf8')) as Mail;
      if (mail.to.toLowerCase() === to.toLowerCase() && (!subject || subject.test(mail.subject))) return mail;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error(`Нет письма для ${to}${subject ? ` (${subject})` : ''}`);
}

/** Ссылка из письма в админку: `http://app.localhost:3102/verify-email?token=…`. */
export const linkFrom = (mail: Mail): string => {
  const link = /https?:\/\/\S+/.exec(mail.text)?.[0];
  if (!link) throw new Error(`В письме «${mail.subject}» нет ссылки`);
  return link;
};

/** Вход демо-владельцем сида в этом контексте браузера. */
export async function loginAsDemo(page: Page): Promise<void> {
  await apiCall(page, 'POST', '/v1/auth/login', { email: DEMO.email, password: DEMO.password });
}

export type ShopAccount = { email: string; password: string; subdomain: string; name: string };

/**
 * Новый магазин через API: регистрация (контекст браузера входит), мастер пройден, почта подтверждена. Каждый тест,
 * который что-то меняет, работает в своём магазине — тесты не мешают друг другу и демо-магазину.
 */
export async function newShop(
  page: Page,
  options: { setup?: boolean; verify?: boolean; name?: string } = {},
): Promise<ShopAccount> {
  const id = unique();
  const account: ShopAccount = {
    email: `e2e-${id}@shop.test`,
    password: `pass-${id}-e2e`,
    subdomain: `e2e-${id}`,
    name: options.name ?? `Магазин ${id}`,
  };
  await apiCall(page, 'POST', '/v1/auth/register', { email: account.email, password: account.password });
  if (options.setup !== false) {
    await apiCall(page, 'PATCH', '/v1/admin/shop', {
      name: account.name,
      subdomain: account.subdomain,
      whatsapp: '+77001234567',
      setupCompleted: true,
    });
  }
  if (options.verify !== false) {
    const token = new URL(linkFrom(await readMail(account.email, /Подтвердите/))).searchParams.get('token');
    await apiCall(page, 'POST', '/v1/auth/email/verify', { token });
  }
  return account;
}

type VariantSeed = { price: number; stock: number; sku?: string };

/** Товар через API: варианты без свойств (или с переданными). */
export async function createProduct(
  page: Page,
  product: { name: string; variants?: VariantSeed[]; isVisible?: boolean; categoryId?: string },
): Promise<{ id: string; shortId: string }> {
  return apiCall(page, 'POST', '/v1/admin/products', {
    name: product.name,
    isVisible: product.isVisible ?? true,
    categoryId: product.categoryId ?? null,
    variants: (product.variants ?? [{ price: 9900, stock: 5 }]).map((v) => ({ ...v, sku: v.sku ?? null, values: [] })),
  });
}

export async function publishShop(page: Page): Promise<void> {
  await apiCall(page, 'POST', '/v1/admin/shop/publish');
}

/** Публичный API витрины напрямую (из теста, мимо браузера) — чтобы найти данные для сценария. */
export async function storefrontApi<T>(subdomain: string, path = ''): Promise<T> {
  const response = await fetch(`${API_URL}/v1/storefront/${subdomain}${path}`);
  if (!response.ok) throw new Error(`storefront ${subdomain}${path} → ${response.status}`);
  return (await response.json()) as T;
}
