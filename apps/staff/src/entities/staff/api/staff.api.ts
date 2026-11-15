import { staffMeOptions } from '@catalog/contract/query';

/** Кто вошёл в суперадминку; 401 — сессии сотрудника нет. */
export const staffMeQueryOptions = () => ({ ...staffMeOptions(), retry: false });
