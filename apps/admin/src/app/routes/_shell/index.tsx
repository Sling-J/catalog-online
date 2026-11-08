import { getStatsOptions } from '@catalog/contract/query';
import { createFileRoute } from '@tanstack/react-router';

import { importsQueryOptions } from '@/entities/import';
import { HomePage } from '@/pages/home';

// «Главная» (A31): до публикации — чек-лист и публикация, после — сводка «что происходит и что сделать».
// Один адрес в любом статусе: статус меняет содержимое, а не адрес. Сводку не ждём — пока грузится, видна загрузка.
export const Route = createFileRoute('/_shell/')({
  loader: ({ context: { queryClient } }) => {
    void queryClient.prefetchQuery(getStatsOptions({ query: { period: '7d' } }));
    void queryClient.prefetchInfiniteQuery(importsQueryOptions());
  },
  component: HomePage,
});
