// Админка работает на моках, пока нет API (E3): в разработке запросы перехватывает service worker MSW.
// Отключить: VITE_API_MOCKS=off. Импорты динамические, чтобы демо-данные не попадали в продакшен-сборку.
export async function startMocks(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.VITE_API_MOCKS === 'off') return;
  const [{ setupWorker }, { demoAdminHandlers }] = await Promise.all([
    import('msw/browser'),
    import('@catalog/contract/msw'),
  ]);
  await setupWorker(...demoAdminHandlers()).start({ onUnhandledRequest: 'bypass', quiet: true });
}
