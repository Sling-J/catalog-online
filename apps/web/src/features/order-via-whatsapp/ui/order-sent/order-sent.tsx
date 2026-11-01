import { Button } from '@catalog/ui';
import { Plural, Trans } from '@lingui/react/macro';
import { useEffect, useState } from 'react';

import { formatPrice } from '@/shared/lib';
import { ClayBubble } from '@/shared/ui';

import type { SentOrder } from '@/features/order-via-whatsapp/types';

/**
 * «Отправлено ✓»: заявка ушла в WhatsApp, номера заказа нет — заказы не храним (D14).
 * Телефон: кнопка «Вернуться в каталог» и ссылка «Открыть WhatsApp ещё раз» под ней; компьютер: кнопки в ряд
 * и «Скопировать текст», чтобы отправить заказ с телефона (S11).
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

  const count = <Plural value={order.count} one="# товар" few="# товара" many="# товаров" other="# товара" />;
  const thumbs = order.photos.slice(0, 4).map((photo, index) => (
    <li key={index} className="size-[52px] overflow-hidden rounded-[14px] bg-chip-haze lg:size-12 lg:rounded-xl">
      {photo && <img src={photo} alt="" className="size-full object-cover" />}
    </li>
  ));

  return (
    <div className="pt-2 text-center lg:pt-0">
      <ClayBubble>
        <Trans>Отправлено ✓</Trans>
      </ClayBubble>
      <p className="mt-6 text-[21px] font-extrabold tracking-[-0.01em] lg:mt-[26px] lg:text-[28px] lg:tracking-[-0.02em]">
        <Trans>Заявка ушла в WhatsApp</Trans>
      </p>
      <p className="mx-auto mt-2 max-w-[300px] text-[15px] leading-normal text-ink-soft lg:mt-2.5 lg:max-w-[460px] lg:text-[16px] lg:leading-[1.55]">
        <Trans>Магазин проверит наличие и ответит вам в чате.</Trans>{' '}
        <span className="lg:hidden">
          <Trans>Если WhatsApp не открылся — нажмите «Открыть ещё раз».</Trans>
        </span>
        <span className="hidden lg:inline">
          <Trans>Если WhatsApp не открылся — откройте ещё раз или скопируйте текст заказа и отправьте сами.</Trans>
        </span>
      </p>

      {/* телефон: белая карточка, сверху число и сумма, ниже миниатюры */}
      <div className="mx-auto mt-[26px] max-w-[320px] rounded-row border border-[#eceaf5] bg-white p-4 text-left lg:hidden">
        <div className="flex justify-between text-[14px] text-ink-quiet">
          <span>{count}</span>
          <span className="text-[16px] font-extrabold text-ink-night tabular-nums">{formatPrice(order.total)}</span>
        </div>
        <ul className="mt-3 flex gap-2">{thumbs}</ul>
      </div>
      {/* компьютер: одна строка — миниатюры, число, сумма */}
      <div className="mx-auto mt-[22px] hidden max-w-[420px] items-center gap-3 rounded-[20px] bg-[#f6f5fb] px-4 py-3.5 text-left lg:flex">
        <ul className="flex gap-3">{thumbs}</ul>
        <span className="flex-1 text-[14px] text-ink-quiet">{count}</span>
        <span className="text-[17px] font-extrabold tabular-nums">{formatPrice(order.total)}</span>
      </div>

      {/* телефон: кнопка и под ней ссылка «Открыть WhatsApp ещё раз»; компьютер: главная кнопка во всю ширину,
          под ней в ряд две второстепенные — так подписи никогда не переносятся */}
      <div className="mt-[22px] flex flex-col items-center gap-1.5 lg:mt-[26px] lg:items-stretch lg:gap-2.5">
        <Button size="state" onClick={onClose}>
          <Trans>Вернуться в каталог</Trans>
        </Button>
        <a
          href={order.url}
          target="_blank"
          rel="noreferrer"
          className="press inline-flex h-11 items-center justify-center rounded-pill px-4 text-[15px] font-semibold whitespace-nowrap text-iris hover:underline lg:hidden"
        >
          <Trans>Открыть WhatsApp ещё раз</Trans>
        </a>
        <div className="hidden grid-cols-2 gap-2.5 lg:grid">
          <a
            href={order.url}
            target="_blank"
            rel="noreferrer"
            className="press inline-flex h-[52px] items-center justify-center rounded-pill bg-chip-haze px-[22px] text-[15px] font-semibold whitespace-nowrap text-ink-night hover:bg-haze-hover"
          >
            <Trans>Открыть WhatsApp</Trans>
          </a>
          <button
            type="button"
            onClick={copy}
            className="inline-flex h-[52px] items-center justify-center rounded-pill bg-chip-haze px-[22px] text-[15px] font-semibold whitespace-nowrap text-ink-night hover:bg-haze-hover"
          >
            {copied ? <Trans>Скопировано</Trans> : <Trans>Скопировать текст</Trans>}
          </button>
        </div>
      </div>
    </div>
  );
}
