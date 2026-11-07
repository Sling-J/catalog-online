import { createFileRoute } from '@tanstack/react-router';

import { QuickPhotosPage, quickQueueQueryOptions } from '@/pages/quick-photos';

// Быстрый режим «Добавить фото» (T-308) — вложенный экран. Очередь снимаем при каждом входе заново.
export const Route = createFileRoute('/_shell/products_/photos')({
  staticData: { subScreen: true },
  loader: ({ context: { queryClient } }) => queryClient.fetchQuery({ ...quickQueueQueryOptions(), staleTime: 0 }),
  component: QuickPhotosPage,
});
