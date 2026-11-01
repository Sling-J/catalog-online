import { listStorefrontCategoriesOptions } from '@catalog/contract/query';

/** Дерево категорий магазина (только с товарами в наличии). */
export const categoriesQueryOptions = (subdomain: string) => listStorefrontCategoriesOptions({ path: { subdomain } });
