import { resolve } from 'node:path';

/** Фото демо-магазина — те же, что у моков: design-assets/storefront в корне репозитория (`db:seed`, `demo:publish`). */
export const DEMO_PHOTOS_DIR = resolve(import.meta.dirname, '../../../../../../design-assets/storefront');
