import { Button, Sheet } from '@catalog/ui';
import { Trans, useLingui } from '@lingui/react/macro';
import { useQuery } from '@tanstack/react-query';
import { useUnit } from 'effector-react';

import {
  $checkState,
  $comment,
  $items,
  $notices,
  $open,
  $payable,
  $total,
  cartClosed,
  commentChanged,
  itemRemoved,
  MAX_COMMENT_LENGTH,
  quantityChanged,
} from '@/entities/cart';
import { shopQueryOptions } from '@/entities/shop';
import { $sentOrder, OrderButton, OrderSent } from '@/features/order-via-whatsapp';
import { useSheetPlacement } from '@/shared/hooks';
import { formatPrice } from '@/shared/lib';

import { CartLine } from './cart-line';

/**
 * Корзина шторкой снизу (окно на компьютере). При открытии цены и наличие перепроверяются:
 * общая плашка «магазин кое-что обновил» и плашка у каждой изменённой строки (FR-V7, S3, S10).
 * После «Заказать через WhatsApp» вместо корзины — экран «Отправлено ✓» (FR-V8).
 */
export function CartSheet({ subdomain }: { subdomain: string }) {
  const { t } = useLingui();
  const placement = useSheetPlacement();
  const { data: shop } = useQuery(shopQueryOptions(subdomain));
  const { open, items, payable, notices, checkState, total, comment, sentOrder } = useUnit({
    open: $open,
    items: $items,
    payable: $payable,
    notices: $notices,
    checkState: $checkState,
    total: $total,
    comment: $comment,
    sentOrder: $sentOrder,
  });
  const { close, setQuantity, remove, setComment } = useUnit({
    close: cartClosed,
    setQuantity: quantityChanged,
    remove: itemRemoved,
    setComment: commentChanged,
  });
  const hasChanges = Object.keys(notices).length > 0;

  return (
    <Sheet open={open} onClose={close} placement={placement} title={sentOrder ? t`Заказ отправлен` : t`Корзина`}>
      {sentOrder ? (
        <OrderSent order={sentOrder} onClose={close} />
      ) : (
        <>
          {checkState === 'loading' && (
            <p role="status" className="mb-3 text-caption text-ink-quiet">
              <Trans>Проверяем цены и наличие…</Trans>
            </p>
          )}
          {checkState === 'failed' && (
            <p role="status" className="mb-3 rounded-thumb bg-chip-haze px-3.5 py-2.5 text-[13px] text-ink-soft">
              <Trans>Не удалось проверить цены и наличие — показываем сохранённую корзину.</Trans>
            </p>
          )}
          {hasChanges && (
            <p
              role="status"
              className="mb-3 rounded-thumb bg-[#fff1d6] px-3.5 py-2.5 text-[13px] font-semibold text-stock-low"
            >
              <Trans>Магазин кое-что обновил — проверьте корзину.</Trans>
            </p>
          )}

          {items.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-[18px] font-extrabold">
                <Trans>В корзине пока пусто</Trans>
              </p>
              <Button className="mt-4" onClick={close}>
                <Trans>Вернуться в каталог</Trans>
              </Button>
            </div>
          ) : (
            <>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <CartLine
                    key={item.variantId}
                    item={item}
                    notices={notices[item.variantId]}
                    onQuantity={(quantity) => setQuantity({ variantId: item.variantId, quantity })}
                    onRemove={() => remove(item.variantId)}
                    onNavigate={close}
                  />
                ))}
              </ul>

              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                maxLength={MAX_COMMENT_LENGTH}
                rows={2}
                placeholder={t`Комментарий для магазина`}
                aria-label={t`Комментарий для магазина`}
                className="mt-4 w-full resize-none rounded-field bg-[#f6f5fb] px-3.5 py-3 text-[15px] text-ink-night outline-none placeholder:text-ink-muted focus:ring-2 focus:ring-ink-night"
              />

              <div className="mt-[18px] flex items-baseline justify-between">
                <span className="text-[15px] text-ink-soft">
                  <Trans>Итого</Trans>
                </span>
                <span className="text-[22px] font-extrabold tabular-nums">{formatPrice(total)}</span>
              </div>

              <div className="mt-3.5">
                <OrderButton
                  subdomain={subdomain}
                  shop={shop ?? { name: '', whatsapp: '' }}
                  items={payable}
                  total={total}
                  comment={comment}
                  disabled={!shop || checkState === 'loading'}
                />
                <p className="mt-2.5 text-center text-[12px] text-ink-muted">
                  <Trans>Откроется WhatsApp с готовым сообщением для магазина</Trans>
                </p>
              </div>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}
