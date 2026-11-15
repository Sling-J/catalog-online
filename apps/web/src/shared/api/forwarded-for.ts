import { createIsomorphicFn } from '@tanstack/react-start';
import { getRequestHeader, getRequestIP } from '@tanstack/react-start/server';

/**
 * `X-Forwarded-For` для запросов SSR к API: цепочка из запроса покупателя (её пишет Caddy) плюс адрес, от которого
 * пришёл сам запрос к витрине (Caddy). Иначе API видит у всех первых заходов один IP — сервера витрины — и
 * ограничение частоты считает всех покупателей одним (api.md, «Ограничение частоты»). Подделку слева API отбрасывает
 * сам: верит только своим прокси (`TRUST_PROXY` списком подсетей). В браузере заголовок не нужен.
 */
export const getForwardedFor = createIsomorphicFn()
  .server((): string | undefined => {
    const chain = [getRequestHeader('x-forwarded-for'), getRequestIP()].filter(Boolean);
    return chain.length > 0 ? chain.join(', ') : undefined;
  })
  .client((): undefined => undefined);
