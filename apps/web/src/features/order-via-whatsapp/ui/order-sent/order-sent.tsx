import { Button } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { formatPrice } from '@/shared/lib';
import { Icon } from '@/shared/ui';

import type { SentOrder } from '@/features/order-via-whatsapp/types';

/**
 * «Отправлено ✓»: заявка ушла в WhatsApp, номера заказа нет — заказы не храним (D14).
 * Можно открыть WhatsApp ещё раз; на компьютере — скопировать текст, чтобы отправить его с телефона (S11).
 */
export function OrderSent({ order, onClose }: { order: SentOrder; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(id);
  }, [copied]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(order.text);
      setCopied(true);
    } catch {
      // буфер недоступен — текст остаётся в WhatsApp по ссылке выше
    }
  };

  return (
    <div className="py-2 text-center">
      <div className="inline-block -rotate-3 rounded-[26px] bg-mint px-[22px] py-3.5 text-[22px] font-extrabold text-mint-ink shadow-[0_6px_0_var(--color-mint-underside)]">
        <Trans>Отправлено ✓</Trans>
      </div>
      <p className="mt-[22px] text-[20px] font-extrabold">
        <Trans>Заявка ушла в WhatsApp</Trans>
      </p>
      <p className="mt-1.5 text-[15px] leading-normal text-ink-soft">
        <Trans>Магазин проверит наличие и ответит вам в чате</Trans>
      </p>

      <div className="mx-auto mt-4 flex max-w-[320px] items-center justify-center gap-2.5 rounded-row bg-[#f1effa] px-3.5 py-2.5">
        <ul className="flex -space-x-2">
          {order.photos.slice(0, 4).map((photo, index) => (
            <li key={index} className="size-9 overflow-hidden rounded-full bg-chip-haze ring-2 ring-[#f1effa]">
              {photo && <img src={photo} alt="" className="size-full object-cover" />}
            </li>
          ))}
        </ul>
        <p className="text-[14px] text-ink-soft">
          <Plural value={order.count} one="# товар" few="# товара" many="# товаров" other="# товара" /> ·{' '}
          <span className="font-bold text-ink-night tabular-nums">{formatPrice(order.total)}</span>
        </p>
      </div>

      <div className="mt-5 flex flex-col gap-2.5">
        <Button block onClick={onClose}>
          <Trans>Вернуться в каталог</Trans>
        </Button>
        <a
          href={order.url}
          target="_blank"
          rel="noreferrer"
          className="inline-flex h-11 items-center justify-center rounded-pill bg-white text-[15px] font-semibold text-ink-night ring-[1.5px] ring-inset ring-[#dad6ec]"
        >
          <Trans>Открыть WhatsApp ещё раз</Trans>
        </a>
        <button
          type="button"
          onClick={copy}
          className="hidden h-11 items-center justify-center gap-1.5 rounded-pill text-[15px] font-semibold text-ink-quiet lg:inline-flex"
        >
          <Icon name={copied ? 'check' : 'copy'} size={16} />
          {copied ? <Trans>Скопировано</Trans> : <Trans>Скопировать текст</Trans>}
        </button>
      </div>
    </div>
  );
}
