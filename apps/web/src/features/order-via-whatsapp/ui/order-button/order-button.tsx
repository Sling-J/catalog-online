import { cx } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useUnit } from 'effector-react';

import type { CartItem } from '@/entities/cart';
import { whatsappLink } from '@/entities/shop';
import { buildOrderText } from '@/features/order-via-whatsapp/lib';
import { orderSent } from '@/features/order-via-whatsapp/model';

/**
 * Мятная «Заказать через WhatsApp»: обычная ссылка на `wa.me` с готовым текстом — так браузер не блокирует
 * открытие, а на телефоне сразу запускается приложение. По нажатию корзина очищается, показывается «Отправлено ✓».
 */
export function OrderButton({
  subdomain,
  shop,
  items,
  total,
  comment,
  disabled,
}: {
  subdomain: string;
  shop: { name: string; whatsapp: string };
  /** Позиции, которые можно заказать (без закончившихся). */
  items: CartItem[];
  total: number;
  comment: string;
  /** Например, пока идёт перепроверка цен: заказывать по устаревшим не нужно. */
  disabled: boolean;
}) {
  const { t } = useLingui();
  const sent = useUnit(orderSent);

  const text = buildOrderText({
    greeting: t`Здравствуйте! Заказ с сайта ${shop.name}:`,
    totalLabel: t`Итого`,
    commentLabel: t`Комментарий`,
    items,
    total,
    comment,
  });
  const url = whatsappLink(shop.whatsapp, text);
  const inactive = disabled || items.length === 0;

  return (
    <a
      href={inactive ? undefined : url}
      target="_blank"
      rel="noreferrer"
      aria-disabled={inactive || undefined}
      onClick={(event) => {
        if (inactive) return event.preventDefault();
        sent({
          subdomain,
          url,
          text,
          count: items.reduce((sum, entry) => sum + entry.quantity, 0),
          total,
          photos: items.map((entry) => entry.photo),
        });
      }}
      className={cx(
        'inline-flex h-14 w-full items-center justify-center rounded-pill text-[16px] font-bold lg:h-[52px] lg:text-[15px]',
        'transition-transform duration-200 ease-press focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-iris',
        inactive
          ? 'bg-chip-haze text-ink-quiet'
          : 'bg-mint text-mint-ink shadow-[0_5px_0_var(--color-mint-underside)] active:translate-y-[3px] active:shadow-none lg:shadow-press-mint',
      )}
    >
      <Trans>Заказать через WhatsApp</Trans>
    </a>
  );
}
