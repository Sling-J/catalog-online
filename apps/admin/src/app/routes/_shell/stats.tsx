import { getStatsOptions } from '@catalog/contract/query';
import { createFileRoute } from '@tanstack/react-router';

import { periodOf, StatsPage, validateStatsSearch } from '@/pages/stats';

// «Главная → Статистика» (T-313; с UX-аудита — вложенный экран главной, доступен и в черновике, A31). Вложенный экран: на телефоне без шапки магазина и нижнего меню. Период — в адресе;
// данные не ждём: пока грузятся, видна загрузка, не загрузились — «Повторить» внутри экрана.
export const Route = createFileRoute('/_shell/stats')({
  staticData: { subScreen: true },
  validateSearch: validateStatsSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context: { queryClient }, deps }) => {
    void queryClient.prefetchQuery(getStatsOptions({ query: { period: periodOf(deps) } }));
  },
  component: function ShopStatsRoute() {
    const search = Route.useSearch();
    const navigate = Route.useNavigate();
    return (
      <StatsPage
        period={periodOf(search)}
        onPeriod={(period) => navigate({ search: period === '7d' ? {} : { period }, replace: true })}
      />
    );
  },
});
