import type { Shop } from '@catalog/contract';
import { getMeQueryKey, getShopOptions } from '@catalog/contract/query';
import type { QueryClient } from '@tanstack/react-query';

/** Настройки магазина и чек-лист: нужны шапке, меню и экранам раздела «Магазин». */
export const shopQueryOptions = () => getShopOptions();

/** Ответ API с магазином — в кеш; название, адрес и «мастер пройден» есть и в `me`, его перечитываем. */
export function applyShop(queryClient: QueryClient, shop: Shop): Promise<void> {
  queryClient.setQueryData(shopQueryOptions().queryKey, shop);
  // перечитываем и без подписчиков: `me` проверяют маршруты (мастер пройден?) прямо из кеша
  return queryClient.invalidateQueries({ queryKey: getMeQueryKey(), refetchType: 'all' });
}
