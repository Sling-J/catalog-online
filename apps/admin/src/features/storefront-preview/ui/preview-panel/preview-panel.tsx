import type { AdminToStorefrontMessage, PreviewShopDraft } from '@catalog/contract/preview';
import { Icon } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { previewTokenQueryOptions, withPreview } from '@/entities/shop';

// телефон в панели — как в макете: рамка 320×660, экран 300×640; витрина внутри — шириной настоящего телефона
const FRAME_W = 320;
const FRAME_H = 660;
const SCREEN_W = 300;
const SCREEN_H = 640;
const PHONE_W = 390;
const SCREEN_SCALE = SCREEN_W / PHONE_W;
// сверху заголовок панели, снизу подпись: столько по высоте занято не телефоном
const PANEL_CHROME_H = 32 + 140;

/**
 * Превью витрины в настройках (A7, макет AdminDesk2, экран 8): по кнопке панелью поверх содержимого справа.
 * Внутри — настоящая витрина в iframe с `?preview=<токен>`; несохранённые правки уходят в неё через `postMessage`
 * (`@catalog/contract/preview`): витрина присылает `ready`, мы отвечаем текущими правками и шлём их при каждой
 * правке. Закрывают крестик, Esc и щелчок по затемнению.
 */
export function PreviewPanel({
  open,
  storefrontUrl,
  draft,
  onClose,
}: {
  open: boolean;
  storefrontUrl: string;
  draft: PreviewShopDraft;
  onClose: () => void;
}) {
  const { t } = useLingui();
  const frame = useRef<HTMLIFrameElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const [ready, setReady] = useState(false);
  const sendRef = useRef<(json: string) => void>(undefined);
  const [scale, setScale] = useState(1);
  const token = useQuery({ ...previewTokenQueryOptions(), enabled: open });
  const origin = new URL(storefrontUrl).origin;
  const draftJson = JSON.stringify(draft);

  const draftRef = useRef(draftJson);
  useEffect(() => {
    draftRef.current = draftJson;
  }, [draftJson]);

  // витрина загрузилась (и после каждого перехода внутри неё) и ждёт правки — шлём текущие
  useEffect(() => {
    if (!open) return;
    const send = (json: string) => {
      const message: AdminToStorefrontMessage = {
        source: 'catalog-admin',
        type: 'shop-draft',
        shop: JSON.parse(json) as PreviewShopDraft,
      };
      frame.current?.contentWindow?.postMessage(message, origin);
    };
    const onMessage = (event: MessageEvent) => {
      if (event.origin !== origin || event.source !== frame.current?.contentWindow) return;
      const data = event.data as { source?: unknown; type?: unknown } | null;
      if (data?.source !== 'catalog-storefront' || data.type !== 'ready') return;
      setReady(true);
      send(draftRef.current);
    };
    window.addEventListener('message', onMessage);
    sendRef.current = send;
    return () => {
      window.removeEventListener('message', onMessage);
      sendRef.current = undefined;
      setReady(false);
    };
  }, [open, origin]);

  // каждая правка — полный набор правок поверх сохранённого магазина
  useEffect(() => {
    if (ready) sendRef.current?.(draftJson);
  }, [ready, draftJson]);

  // Esc, фокус на крестик, телефон помещается по высоте окна
  useEffect(() => {
    if (!open) return;
    close.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const fit = () => setScale(Math.min(1, Math.max(0.5, (window.innerHeight - PANEL_CHROME_H) / FRAME_H)));
    fit();
    window.addEventListener('keydown', onKey);
    window.addEventListener('resize', fit);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', fit);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <>
      <div
        aria-hidden="true"
        onClick={onClose}
        className="fixed inset-y-0 right-0 left-[248px] z-40 bg-ink-night/18 motion-safe:animate-fade-fast"
      />
      <aside
        aria-label={t`Превью витрины`}
        className="fixed top-4 right-4 bottom-4 z-50 flex w-[400px] flex-col items-center justify-center rounded-[28px] bg-lilac-mist shadow-[-20px_0_60px_rgb(23_19_61/0.22)] motion-safe:animate-pop"
      >
        <div className="absolute top-4 right-4 left-5 flex items-center justify-between">
          <span className="text-[15px] font-bold">
            <Trans>Превью витрины</Trans>
          </span>
          <button
            ref={close}
            type="button"
            onClick={onClose}
            aria-label={t`Закрыть превью`}
            className="press flex size-10 items-center justify-center rounded-full bg-white/75 hover:bg-white"
          >
            <Icon name="close" size={16} strokeWidth={2.4} />
          </button>
        </div>
        <div className="mt-[30px]" style={{ zoom: scale }}>
          <div
            className="rounded-[44px] border border-white/90 bg-white/60 p-2.5 shadow-[0_40px_90px_rgb(40_20_110/0.28)]"
            style={{ width: FRAME_W, height: FRAME_H }}
          >
            <div className="h-full w-full overflow-hidden rounded-[34px] bg-paper">
              {token.data ? (
                <iframe
                  ref={frame}
                  title={t`Витрина магазина`}
                  src={withPreview(`${storefrontUrl}/`, token.data)}
                  className="origin-top-left border-0"
                  style={{ width: PHONE_W, height: SCREEN_H / SCREEN_SCALE, transform: `scale(${SCREEN_SCALE})` }}
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-[13px] text-ink-quiet">
                  {token.isError ? (
                    <Trans>Не получилось открыть превью. Проверьте интернет и попробуйте ещё раз.</Trans>
                  ) : (
                    <Trans>Открываем витрину…</Trans>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="mt-3.5 text-[13px] text-ink-quiet">
          <Trans>Несохранённые изменения тоже видны</Trans>
        </p>
      </aside>
    </>
  );
}
