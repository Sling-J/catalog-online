// Фронт работает на моках, пока нет API (E1): в разработке запросы перехватывает MSW —
// на сервере (SSR) через msw/node, в браузере через service worker. Отключить: VITE_API_MOCKS=off.
// Импорты динамические, чтобы демо-данные не попадали в продакшен-сборку.
// Фото отдаёт само приложение по /demo, поэтому адреса в моках относительные: так они верны и при SSR, и в браузере.
const assetBase = '';

let started: Promise<void> | undefined;

export function startMocks(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCKS === 'off') return Promise.resolve();
  started ??= import.meta.env.SSR ? startServer() : startBrowser();
  return started;
}

async function startServer(): Promise<void> {
  const [{ setupServer }, { demoStorefrontHandlers }] = await Promise.all([
    import('msw/node'),
    import('@catalog/contract/msw'),
  ]);
  setupServer(...demoStorefrontHandlers({ assetBase })).listen({ onUnhandledRequest: 'bypass' });
}

async function startBrowser(): Promise<void> {
  const [{ setupWorker }, { demoStorefrontHandlers }] = await Promise.all([
    import('msw/browser'),
    import('@catalog/contract/msw'),
  ]);
  await setupWorker(...demoStorefrontHandlers({ assetBase })).start({ onUnhandledRequest: 'bypass', quiet: true });
}
