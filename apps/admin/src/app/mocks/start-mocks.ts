// Моки MSW — только в режиме `vite --mode mocks` (VITE_API_MOCKS=on, `.env.mocks`): e2e, сверка с макетами, работа без
// API. По умолчанию админка ходит в настоящий API (T-501). Импорты динамические, чтобы демо-данные не попадали в
// продакшен-сборку.
// Фото демо-товаров — с этого же сервера (/demo/<имя>.jpg, vite.config.ts). Сессия моков хранится в localStorage (ключ `catalog-admin-mock-session`): вход, выход и регистрация переживают перезагрузку.
export async function startMocks(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCKS !== 'on') return;
  const [{ setupWorker }, { demoAdminHandlers }] = await Promise.all([
    import('msw/browser'),
    import('@catalog/contract/msw'),
  ]);
  await setupWorker(...demoAdminHandlers({ storage: window.localStorage, assetBase: '' })).start({
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
}
