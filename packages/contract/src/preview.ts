// Сообщения между админкой и витриной в режиме превью (A7, T-113). Витрина открыта в iframe админки
// с `?preview=<токен>`; несохранённые правки «О магазине» и мастера админка присылает через postMessage,
// витрина подставляет их поверх данных магазина, не дожидаясь сохранения.
import { z } from 'zod';

import { zStorefrontShop } from './gen/zod.gen.js';

/** Поля магазина, которые админка может подменить в превью. Адрес витрины и признак превью не меняются. */
export const zPreviewShopDraft = zStorefrontShop
  .pick({
    name: true,
    logo: true,
    description: true,
    address: true,
    howToFind: true,
    whatsapp: true,
    instagram: true,
    schedule: true,
    timezone: true,
    stockDisplay: true,
  })
  .partial();

export type PreviewShopDraft = z.infer<typeof zPreviewShopDraft>;

/** Админка → витрина. */
export const zAdminToStorefrontMessage = z.discriminatedUnion('type', [
  /** Несохранённые правки магазина: витрина показывает их поверх сохранённых. Каждый раз — полный набор правок. */
  z.object({ source: z.literal('catalog-admin'), type: z.literal('shop-draft'), shop: zPreviewShopDraft }),
  /** Изменения сохранены (товары, категории, магазин): витрина перечитывает данные. */
  z.object({ source: z.literal('catalog-admin'), type: z.literal('reload') }),
]);

export type AdminToStorefrontMessage = z.infer<typeof zAdminToStorefrontMessage>;

/** Витрина → админка: превью загрузилось и ждёт правки (админка отвечает текущим `shop-draft`). */
export type StorefrontToAdminMessage = { source: 'catalog-storefront'; type: 'ready' };
