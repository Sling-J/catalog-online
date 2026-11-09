import type { Me } from '@catalog/contract';

import type { MeRow } from './auth.repository.js';

/** Строка аккаунта с магазином → `Me` контракта. */
export function toMe(row: MeRow, impersonated: boolean): Me {
  return {
    account: {
      id: row.accountId,
      email: row.email,
      emailVerified: row.emailVerifiedAt !== null,
      impersonated,
    },
    shop: {
      id: row.shopId,
      name: row.shopName,
      subdomain: row.subdomain,
      status: row.status,
      setupCompleted: row.setupCompleted,
    },
  };
}
