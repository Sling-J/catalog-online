import { useLingui } from '@lingui/react/macro';
import { useQuery, useQueryClient, useSuspenseQuery } from '@tanstack/react-query';
import { type MouseEvent, type ReactNode, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';

import { Toast } from '@/shared/ui';

import { previewTokenQueryOptions, shopQueryOptions } from '../../api';
import { storefrontUrl, withPreview } from '../../lib';

/**
 * Ссылка на витрину магазина в новой вкладке. Пока витрина не опубликована, обычный адрес покупателю не отвечает,
 * поэтому ведём в режим превью (`?preview=<токен>`, T-113; UX-аудит, E2). Токен берём заранее; не успел прийти к
 * нажатию — вкладку открываем сразу (иначе её заблокирует браузер) и подставляем адрес, когда токен придёт.
 * Токен не дали (витрина заблокирована, нет связи) — вкладку закрываем и говорим об этом сообщением: обычный адрес
 * черновика покупателю не отвечает, открывать его бессмысленно. Адреса витрины ещё нет (мастер не пройден) — ничего
 * не рисуем.
 */
export function StorefrontLink({
  path = '',
  className,
  children,
  label,
}: {
  /** Путь внутри витрины, например `/<slug>-<shortId>` товара. */
  path?: string;
  className?: string;
  children: ReactNode;
  /** Имя ссылки для дикторов, если текст ссылки короткий. */
  label?: string;
}) {
  const { t } = useLingui();
  const queryClient = useQueryClient();
  const [failed, setFailed] = useState<string | null>(null);
  const hideFailed = useCallback(() => setFailed(null), []);
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const preview = shop.status !== 'published';
  const token = useQuery({
    ...previewTokenQueryOptions(),
    enabled: preview && shop.status !== 'blocked' && Boolean(shop.subdomain),
    retry: false,
  });
  if (!shop.subdomain) return null;

  const url = `${storefrontUrl(shop.subdomain, window.location.origin)}${path}`;
  const href = !preview ? url : token.data ? withPreview(url, token.data) : url;

  const open = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!preview || token.data) return;
    event.preventDefault();
    if (shop.status === 'blocked') {
      setFailed(t`Витрина заблокирована — превью недоступно`);
      return;
    }
    const tab = window.open('about:blank', '_blank');
    if (tab) tab.opener = null;
    void queryClient
      .fetchQuery(previewTokenQueryOptions())
      .then((value) => {
        const target = withPreview(url, value);
        if (tab) tab.location.replace(target);
        else window.open(target, '_blank', 'noreferrer');
      })
      .catch(() => {
        tab?.close();
        setFailed(t`Не удалось открыть превью витрины. Попробуйте ещё раз`);
      });
  };

  return (
    <>
      <a href={href} target="_blank" rel="noreferrer" aria-label={label} onClick={open} className={className}>
        {children}
      </a>
      {/* ссылка бывает внутри текста — сообщение выносим в body */}
      {failed && createPortal(<Toast error message={failed} onHide={hideFailed} />, document.body)}
    </>
  );
}
