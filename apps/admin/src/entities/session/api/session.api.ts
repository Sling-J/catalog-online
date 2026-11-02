import { getMeOptions } from '@catalog/contract/query';

/** Текущий аккаунт и магазин; 401 — сессии нет. */
export const meQueryOptions = () => ({ ...getMeOptions(), retry: false });
