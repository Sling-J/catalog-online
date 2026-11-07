import { createFileRoute } from '@tanstack/react-router';

import { ImportHistoryPage } from '@/pages/import-history';

// «Импорт → История импортов». Вложенный экран: на телефоне без шапки магазина и нижнего меню.
export const Route = createFileRoute('/_shell/import_/history')({
  staticData: { subScreen: true },
  component: ImportHistoryPage,
});
