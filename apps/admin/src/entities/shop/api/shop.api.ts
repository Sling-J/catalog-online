import type { Me, Shop } from '@catalog/contract';
import { getMeQueryKey, getShopOptions } from '@catalog/contract/query';
import type { QueryClient } from '@tanstack/react-query';

/** Настройки магазина и чек-лист: нужны шапке, меню и экранам раздела «Магазин». */
export const shopQueryOptions = () => getShopOptions();

/**
 * Ответ API с магазином — в кеш. Название, адрес и статус есть и в `me` (по нему маршруты решают, пройден ли мастер):
 * правим их там же, без запроса. Раньше `me` перечитывался после каждого шага мастера и каждого сохранения — лишний
 * запрос на каждое действие (e2e T-502). «Мастер пройден» в ответе нет — его передаёт тот, кто его менял.
 */
export function applyShop(queryClient: QueryClient, shop: Shop, changes: { setupCompleted?: boolean } = {}): void {
  queryClient.setQueryData(shopQueryOptions().queryKey, shop);
  queryClient.setQueryData<Me>(getMeQueryKey(), (me) =>
    me
      ? {
          ...me,
          shop: {
            ...me.shop,
            name: shop.name ?? null,
            subdomain: shop.subdomain ?? null,
            status: shop.status,
            ...(changes.setupCompleted === undefined ? {} : { setupCompleted: changes.setupCompleted }),
          },
        }
      : me,
  );
}
