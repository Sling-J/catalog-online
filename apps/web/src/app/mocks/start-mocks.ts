// Моки MSW — только в режиме `vite dev --mode mocks` (VITE_API_MOCKS=on, `.env.mocks`): запросы перехватываются на
// сервере (SSR) через msw/node, в браузере через service worker. По умолчанию витрина ходит в настоящий API (T-501).
// Импорты динамические, чтобы демо-данные не попадали в продакшен-сборку.
// Фото отдаёт само приложение по /demo, поэтому адреса в моках относительные: так они верны и при SSR, и в браузере.
const assetBase = '';

let started: Promise<void> | undefined;

export function startMocks(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCKS !== 'on') return Promise.resolve();
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
