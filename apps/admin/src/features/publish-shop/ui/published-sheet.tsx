import { Button, Icon, Sheet, useIsDesktop } from '@catalog/ui';
import { Trans } from '@lingui/react/macro';
import { useSuspenseQuery } from '@tanstack/react-query';

import { shopQueryOptions, storefrontHost, storefrontUrl, whatsappShareUrl } from '@/entities/shop';
import { useCopied } from '@/shared/hooks';

/**
 * Момент успеха после «Опубликовать» (UX-аудит, U4): витрина видна всем — адрес, «Скопировать ссылку»,
 * «Отправить в WhatsApp» и «Открыть витрину». Экран под шторкой не меняется: остаёмся там, где нажали.
 */
export function PublishedSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const isDesktop = useIsDesktop();
  const { data: shop } = useSuspenseQuery(shopQueryOptions());
  const { copied, copy } = useCopied();
  if (!shop.subdomain) return null;
  const url = storefrontUrl(shop.subdomain, window.location.origin);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      placement={isDesktop ? 'center' : 'bottom'}
      title={<Trans>Витрина опубликована</Trans>}
    >
      <p className="-mt-[9px] text-[15px] leading-[1.45] text-ink-quiet">
        <Trans>
          Покупатели уже видят каталог. Поделитесь ссылкой — в Instagram, в WhatsApp, с постоянными клиентами.
        </Trans>
      </p>
      <div className="mt-4 rounded-[20px] bg-lilac-mist p-3.5">
        <div className="text-[13px] font-semibold text-ink-quiet">
          <Trans>Адрес витрины</Trans>
        </div>
        <div className="mt-1 truncate text-[18px] font-extrabold">{storefrontHost(url)}</div>
      </div>
      <div className="mt-[18px] flex flex-col gap-2.5">
        <Button variant="dark" size="form" block onClick={() => copy(url)}>
          <Icon name={copied ? 'check' : 'copy-square'} size={18} strokeWidth={copied ? 2.6 : 2} />
          {copied ? <Trans>Скопировано</Trans> : <Trans>Скопировать ссылку</Trans>}
        </Button>
        <a
          href={whatsappShareUrl(url)}
          target="_blank"
          rel="noreferrer"
          className="press flex h-[52px] items-center justify-center gap-2 rounded-pill bg-mint px-[22px] text-[15px] font-bold text-mint-ink shadow-press-mint hover:bg-mint-hover"
        >
          <Icon name="whatsapp" size={18} />
          <Trans>Отправить в WhatsApp</Trans>
        </a>
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex h-11 items-center justify-center gap-1.5 text-[15px] font-semibold text-iris hover:underline"
        >
          <Icon name="external" size={16} />
          <Trans>Открыть витрину</Trans>
        </a>
      </div>
    </Sheet>
  );
}
