import { getStorefrontShopOptions } from '@catalog/contract/query';

export const shopQueryOptions = (subdomain: string) => getStorefrontShopOptions({ path: { subdomain } });
