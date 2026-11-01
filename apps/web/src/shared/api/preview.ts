import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestUrl } from '@tanstack/react-start/server';

/** Имя параметра адреса с токеном превью (A7): `?preview=<токен>` из `POST /v1/admin/preview-token`. */
export const PREVIEW_PARAM = 'preview';

const read = (params: URLSearchParams): string | undefined => params.get(PREVIEW_PARAM) || undefined;

/**
 * Токен превью из адреса страницы: на сервере — из адреса запроса, в браузере — из адреса окна.
 * Переходы внутри витрины сохраняют параметр в адресе (корневой маршрут, `retainSearchParams`).
 */
export const getPreviewToken = createIsomorphicFn()
  .server((): string | undefined => read(getRequestUrl().searchParams))
  .client((): string | undefined => read(new URLSearchParams(window.location.search)));

/** Витрина открыта превью из админки: события статистики не шлём, поисковикам не показываем. */
export const isPreviewMode = (): boolean => getPreviewToken() !== undefined;
