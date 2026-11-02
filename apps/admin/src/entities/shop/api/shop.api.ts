import { getShopOptions } from '@catalog/contract/query';

/** Настройки магазина и чек-лист: нужны шапке, меню и экранам раздела «Магазин». */
export const shopQueryOptions = () => getShopOptions();
